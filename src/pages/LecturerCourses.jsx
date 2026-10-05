import { useState, useEffect } from "react";
import { Plus, X, Menu, Loader2, Check, Trash2 } from "lucide-react";
import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

// AAUA Departments grouped by Faculty for selection
const AAUA_FACULTIES = [
  {
    faculty: "Faculty of Science",
    departments: ["Computer Science", "Microbiology", "Physics", "Chemistry", "Mathematics", "Plant Science and Biotechnology", "Animal and Environmental Biology"],
  },
  {
    faculty: "Faculty of Computing",
    departments: ["Cyber Security", "Software Engineering", "Information Technology", "Computer Science (Computing)"],
  },
  {
    faculty: "Faculty of Administration and Management Sciences",
    departments: ["Accounting", "Business Administration", "Banking and Finance", "Public Administration", "Marketing"],
  },
  {
    faculty: "Faculty of Social Sciences",
    departments: ["Economics", "Mass Communication", "Political Science", "Sociology", "Geography and Planning Science"],
  },
  {
    faculty: "Faculty of Education",
    departments: ["Science Education", "Arts Education", "Educational Management", "Guidance and Counselling", "Human Kinetics and Health Education"],
  },
  {
    faculty: "Faculty of Arts",
    departments: ["English and Literary Studies", "History and International Studies", "Philosophy", "Religious Studies", "Linguistics and African Languages"],
  },
  {
    faculty: "Faculty of Law",
    departments: ["Public Law", "Private and Property Law", "International Law and Jurisprudence"],
  },
  {
    faculty: "Faculty of Agriculture",
    departments: ["Agricultural Economics and Extension", "Animal Science", "Crop Science", "Soil Science"],
  },
  {
    faculty: "Faculty of Allied Health Sciences",
    departments: ["Nursing Science", "Medical Laboratory Science"],
  },
  {
    faculty: "Faculty of Environmental Designs",
    departments: ["Architecture", "Estate Management", "Surveying and Geoinformatics"],
  },
];

const normalizeAttendanceStatus = (value) =>
  String(value ?? "").trim().toLowerCase();

function LecturerCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    departments: [],
    level: "100 Level",
    totalStudents: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchCoursesData() {
      try {
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found.");

        const { data: rawCourses, error: coursesError } = await supabase
          .from("courses")
          .select("id, course_code, course_name, department, level, total_students")
          .eq("lecturer_id", user.id);

        if (coursesError) throw coursesError;

        if (!rawCourses || rawCourses.length === 0) {
          if (isMounted) {
            setCourses([]);
            setLoading(false);
          }
          return;
        }

        const resolvedCourseIds = rawCourses.map((c) => c.id);

        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("course_id, student_id")
          .in("course_id", resolvedCourseIds);

        if (enrollmentsError) throw enrollmentsError;

        const enrollmentCounts = {};
        enrollments?.forEach((e) => {
          enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
        });

        const { data: sessions, error: sessionsError } = await supabase
          .from("class_sessions")
          .select("id, course_id")
          .in("course_id", resolvedCourseIds);

        if (sessionsError) throw sessionsError;

        const sessionCounts = {};
        const sessionToCourseMap = {};
        sessions?.forEach((s) => {
          sessionCounts[s.course_id] = (sessionCounts[s.course_id] || 0) + 1;
          sessionToCourseMap[s.id] = s.course_id;
        });

        const sessionIds = sessions?.map((s) => s.id) || [];

        let attendanceMap = {};
        if (sessionIds.length > 0) {
          const { data: records, error: recordsError } = await supabase
            .from("attendance_records")
            .select("class_session_id, student_id, status")
            .in("class_session_id", sessionIds);

          if (recordsError) throw recordsError;

          const seenAttendance = new Set();
          records?.forEach((record) => {
            const status = normalizeAttendanceStatus(record.status);
            if (status !== "present" && status !== "late") return;

            const courseId = sessionToCourseMap[record.class_session_id];
            const uniqueKey = `${courseId}_${record.class_session_id}_${record.student_id}`;
            if (seenAttendance.has(uniqueKey)) return;
            seenAttendance.add(uniqueKey);

            attendanceMap[courseId] = (attendanceMap[courseId] || 0) + 1;
          });
        }

        const computedCourses = rawCourses.map((c) => {
          const studentCount = c.total_students ?? enrollmentCounts[c.id] ?? 0;
          const sessionCount = sessionCounts[c.id] || 0;
          const totalPresentRecords = attendanceMap[c.id] || 0;

          const totalPossibleAttendance = studentCount * sessionCount;
          const attendance =
            totalPossibleAttendance > 0
              ? Math.round(
                  (totalPresentRecords / totalPossibleAttendance) * 100,
                )
              : 0;

          return {
            id: c.id,
            code: c.course_code,
            title: c.course_name,
            department: c.department || "General",
            level: c.level,
            attendance,
            students: studentCount,
            sessions: sessionCount,
          };
        });

        if (isMounted) {
          setCourses(computedCourses);
        }
      } catch (err) {
        console.error("Error loading lecturer courses:", err);
        if (isMounted) {
          setError(err.message || "Failed to load course list.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCoursesData();

    const channel = supabase
      .channel("lecturer-courses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enrollments" },
        () => fetchCoursesData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        () => fetchCoursesData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_sessions" },
        () => fetchCoursesData()
      )
      .subscribe();

    const refreshId = window.setInterval(fetchCoursesData, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshId);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartmentToggle = (dept) => {
    setFormData((prev) => {
      const exists = prev.departments.includes(dept);
      if (exists) {
        return {
          ...prev,
          departments: prev.departments.filter((d) => d !== dept),
        };
      } else {
        return {
          ...prev,
          departments: [...prev.departments, dept],
        };
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.departments.length === 0) {
      setError("Please select at least one department.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User authentication context missing.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      if (!profile) {
        const fallbackName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Lecturer";

        await supabase.from("profiles").upsert([
          {
            id: user.id,
            full_name: fallbackName,
            role: "lecturer",
          },
        ]);
      }

      const lecturerName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Lecturer";

      const combinedDepartments = formData.departments.join(", ");

      const { data, error: insertError } = await supabase
        .from("courses")
        .insert([
          {
            course_code: formData.code.trim(),
            course_name: formData.title.trim(),
            department: combinedDepartments,
            level: formData.level,
            total_students: formData.totalStudents ? parseInt(formData.totalStudents, 10) : 0,
            lecturer_id: user.id,
            lecturer_name: lecturerName,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const newCourseCard = {
        id: data.id,
        code: data.course_code,
        title: data.course_name,
        department: combinedDepartments,
        level: data.level,
        attendance: 0,
        students: data.total_students ?? 0,
        sessions: 0,
      };

      setCourses((prev) => [newCourseCard, ...prev]);

      setFormData({
        code: "",
        title: "",
        departments: [],
        level: "100 Level",
        totalStudents: "",
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating course:", err);
      if (err.code === "23503" || err.message?.includes("foreign key constraint")) {
        setError("Foreign key error: Your account ID does not have a matching profile record.");
      } else {
        setError(err.message || "Failed to create new course.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handler to delete/cancel a course
  const handleDeleteCourse = async (courseId, courseCode) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel/delete ${courseCode}? This will also remove associated schedules and records.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(courseId);
      setError(null);

      const { error: deleteError } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (deleteError) throw deleteError;

      // Remove course from local state view
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error("Error deleting course:", err);
      setError(err.message || "Failed to delete course.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LecturerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
        <div className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text-primary"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <img
                  src={logo}
                  alt="ClassPulse"
                  className="h-14 w-auto object-contain sm:h-16"
                />
              </div>
              <span className="text-lg font-bold text-text-primary">
                ClassPulse
              </span>
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Course Management
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Manage your courses and monitor attendance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Course
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              Loading your courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-secondary">
              <p className="text-base font-semibold text-text-primary">
                No courses found
              </p>
              <p className="mt-1 text-sm">
                Click "Add Course" above to create your first course.
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => {
                const attendanceIsLow = course.attendance < 80;
                const isDeleting = deletingId === course.id;

                return (
                  <article
                    key={course.id}
                    className="relative rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-bold text-text-primary sm:text-base">
                            {course.code}
                          </h2>
                          <p className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm">
                            {course.title}
                          </p>
                          <p className="mt-2 text-xs text-text-secondary">
                            {course.department} · {course.level}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                              attendanceIsLow
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {course.attendance}% avg
                          </span>

                          {/* Delete / Cancel Course Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course.id, course.code)}
                            disabled={isDeleting}
                            title="Cancel / Delete Course"
                            className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin text-red-600" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${
                              attendanceIsLow ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${course.attendance}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/50">
                      <span>{course.students} students</span>
                      <span>{course.sessions} sessions</span>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </main>
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="mb-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Add New Course
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Enter course details and select one or more departments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="rounded-lg p-2 text-text-secondary transition hover:bg-background disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Course Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="e.g. CSC 302"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Course Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Computer Networks"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>

              {/* Department Multi-Select Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-text-primary">
                    Departments (Select one or more)
                  </label>
                  <span className="text-xs text-text-secondary">
                    {formData.departments.length} selected
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-3 space-y-3">
                  {AAUA_FACULTIES.map((group) => (
                    <div key={group.faculty} className="space-y-1.5">
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        {group.faculty}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                        {group.departments.map((dept) => {
                          const isSelected = formData.departments.includes(dept);

                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => handleDepartmentToggle(dept)}
                              disabled={submitting}
                              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-left transition ${
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-surface hover:bg-border/50 text-text-primary border border-border"
                              }`}
                            >
                              <span className="truncate pr-2">{dept}</span>
                              {isSelected && <Check size={14} className="shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="level"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Student Level
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  {[
                    "100 Level",
                    "200 Level",
                    "300 Level",
                    "400 Level",
                    "500 Level",
                    "600 Level",
                  ].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="totalStudents"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Number of Students
                </label>
                <input
                  id="totalStudents"
                  name="totalStudents"
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={formData.totalStudents}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-background disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || formData.departments.length === 0}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Course"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerCourses;