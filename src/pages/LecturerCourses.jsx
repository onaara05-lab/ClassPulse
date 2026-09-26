import { useState, useEffect } from "react";
import { Plus, X, Menu, Loader2 } from "lucide-react";
import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

function LecturerCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchCoursesData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Get current logged-in lecturer
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found.");

        // 2. Fetch courses created by this lecturer
        const { data: rawCourses, error: coursesError } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .eq("lecturer_id", user.id);

        if (coursesError) throw coursesError;

        if (!rawCourses || rawCourses.length === 0) {
          if (isMounted) {
            setCourses([]);
            setLoading(false);
          }
          return;
        }

        const courseIds = rawCourses.map((c) => c.id);

        // 3. Fetch count of enrolled students per course
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("course_id, student_id")
          .in("course_id", courseIds);

        if (enrollmentsError) throw enrollmentsError;

        const studentCounts = {};
        enrollments?.forEach((e) => {
          studentCounts[e.course_id] = (studentCounts[e.course_id] || 0) + 1;
        });

        // 4. Fetch class sessions held per course
        const { data: sessions, error: sessionsError } = await supabase
          .from("class_sessions")
          .select("id, course_id")
          .in("course_id", courseIds);

        if (sessionsError) throw sessionsError;

        const sessionCounts = {};
        const sessionToCourseMap = {};
        sessions?.forEach((s) => {
          sessionCounts[s.course_id] = (sessionCounts[s.course_id] || 0) + 1;
          sessionToCourseMap[s.id] = s.course_id;
        });

        const sessionIds = sessions?.map((s) => s.id) || [];

        // 5. Fetch present attendance records across these sessions
        let attendanceMap = {};
        if (sessionIds.length > 0) {
          const { data: records, error: recordsError } = await supabase
            .from("attendance_records")
            .select("class_session_id")
            .in("class_session_id", sessionIds)
            .eq("status", "present");

          if (recordsError) throw recordsError;

          records?.forEach((r) => {
            const courseId = sessionToCourseMap[r.class_session_id];
            attendanceMap[courseId] = (attendanceMap[courseId] || 0) + 1;
          });
        }

        // 6. Aggregate metrics per course
        const computedCourses = rawCourses.map((c) => {
          const studentCount = studentCounts[c.id] || 0;
          const sessionCount = sessionCounts[c.id] || 0;
          const totalPresentRecords = attendanceMap[c.id] || 0;

          // Attendance Avg % = Total Present / (Total Students * Total Sessions)
          const totalPossibleAttendance = studentCount * sessionCount;
          const attendance =
            totalPossibleAttendance > 0
              ? Math.round((totalPresentRecords / totalPossibleAttendance) * 100)
              : 0;

          return {
            id: c.id,
            code: c.course_code,
            title: c.course_name,
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

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User authentication context missing.");

      // Insert new course into Supabase
      const { data, error: insertError } = await supabase
        .from("courses")
        .insert([
          {
            course_code: formData.code.trim(),
            course_name: formData.title.trim(),
            lecturer_id: user.id,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const newCourseCard = {
        id: data.id,
        code: data.course_code,
        title: data.course_name,
        attendance: 0,
        students: 0,
        sessions: 0,
      };

      setCourses((prev) => [newCourseCard, ...prev]);

      setFormData({
        code: "",
        title: "",
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err.message || "Failed to create new course.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Component */}
      <LecturerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
        {/* Mobile Header Bar */}
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

            {/* Mobile Logo Group */}
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

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Page Header */}
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

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              Loading your courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-secondary">
              <p className="text-base font-semibold text-text-primary">No courses found</p>
              <p className="mt-1 text-sm">
                Click "Add Course" above to create your first course.
              </p>
            </div>
          ) : (
            /* Course Cards Grid */
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => {
                const attendanceIsLow = course.attendance < 80;

                return (
                  <article
                    key={course.id}
                    className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md"
                  >
                    {/* Course Code and Attendance Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-text-primary sm:text-base">
                          {course.code}
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm">
                          {course.title}
                        </p>
                      </div>

                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          attendanceIsLow
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {course.attendance}% avg
                      </span>
                    </div>

                    {/* Attendance Progress Bar */}
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

                    {/* Course Details */}
                    <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Add New Course
                </h2>

                <p className="mt-1 text-sm text-text-secondary">
                  Enter the details of your new course.
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

            {/* Course Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Course Code */}
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

              {/* Course Title */}
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

              {/* Form Actions */}
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
                  disabled={submitting}
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