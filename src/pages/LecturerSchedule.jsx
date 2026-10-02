import { useState, useEffect, useCallback } from "react";
import { Plus, X, CalendarDays, Menu, Loader2 } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const buildEmptyWeeklySchedule = () =>
  DAYS_OF_WEEK.map((day) => ({ day, classes: [] }));

const getMinutesFromTime = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

function LecturerSchedule() {
  const [weeklySchedule, setWeeklySchedule] = useState(
    buildEmptyWeeklySchedule(),
  );
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    courseId: "",
    department: "",
    level: "",
    lecturerName: "",
    day: "",
    startTime: "",
    endTime: "",
    venue: "",
    students: "",
  });

  const [error, setError] = useState("");

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = Number(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch lecturer's assigned courses
      let courses = [];

      const resolveLecturerCourseIds = async () => {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Profile fallback lookup failed:", profileError.message);
        }

        const candidateNames = [
          profileData?.full_name,
          user.user_metadata?.full_name,
          user.user_metadata?.name,
          user.email?.split("@")[0],
        ]
          .map((value) => value?.trim())
          .filter(Boolean);

        const { data: lecturerCourses = [], error: directCoursesError } =
          await supabase
            .from("courses")
            .select(
              "id, course_code, course_name, department, level, lecturer_name",
            )
            .eq("lecturer_id", user.id);

        if (directCoursesError) {
          console.warn(
            "Direct lecturer course lookup failed:",
            directCoursesError.message,
          );
        }

        let courseIds = [
          ...new Set((lecturerCourses || []).map((course) => course.id)),
        ];

        for (const candidateName of [...new Set(candidateNames)]) {
          if (courseIds.length > 0) break;

          const { data: namedCourses = [], error: namedCoursesError } =
            await supabase
              .from("courses")
              .select(
                "id, course_code, course_name, department, level, lecturer_name",
              )
              .eq("lecturer_name", candidateName);

          if (namedCoursesError) {
            console.warn(
              "Fallback lecturer-name lookup failed:",
              namedCoursesError.message,
            );
            continue;
          }

          courseIds = [
            ...new Set([
              ...courseIds,
              ...namedCourses.map((course) => course.id),
            ]),
          ];
        }

        const { data: coursesData = [], error: coursesError } =
          courseIds.length > 0
            ? await supabase
                .from("courses")
                .select(
                  "id, course_code, course_name, department, level, lecturer_name",
                )
                .in("id", courseIds)
            : { data: [], error: null };

        if (coursesError) throw coursesError;

        return (coursesData || []).map((course) => ({
          id: course.id,
          code: course.course_code,
          title: course.course_name,
          department: course.department,
          level: course.level,
          lecturerName: course.lecturer_name || "",
        }));
      };

      courses = await resolveLecturerCourseIds();

      if (courses.length === 0) {
        const { data: fallbackCourses, error: fallbackError } = await supabase
          .from("courses")
          .select(
            "id, course_code, course_name, department, level, lecturer_name",
          )
          .order("course_code", { ascending: true });

        if (!fallbackError && fallbackCourses && fallbackCourses.length > 0) {
          courses = fallbackCourses.map((course) => ({
            id: course.id,
            code: course.course_code,
            title: course.course_name,
            department: course.department,
            level: course.level,
            lecturerName: course.lecturer_name || "",
          }));
        }
      }

      setAvailableCourses(courses);

      const courseIds = courses.map((course) => course.id);

      if (courseIds.length === 0) {
        setWeeklySchedule(buildEmptyWeeklySchedule());
        setLoading(false);
        return;
      }

      // 2. Fetch schedules for these courses
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedules")
        .select(
          `
          id,
          day,
          start_time,
          end_time,
          venue,
          student_count,
          department,
          level,
          lecturer_name,
          courses (id, course_code, course_name)
        `,
        )
        .in("course_id", courseIds)
        .order("start_time", { ascending: true });

      if (scheduleError) throw scheduleError;

      // Format schedule items for the UI grid
      const formattedSchedule = DAYS_OF_WEEK.map((day) => {
        const dayClasses = (scheduleData || [])
          .filter(
            (item) => item.day && item.day.toLowerCase() === day.toLowerCase(),
          )
          .sort(
            (a, b) =>
              getMinutesFromTime(a.start_time) -
              getMinutesFromTime(b.start_time),
          )
          .map((item) => ({
            id: item.id,
            course: item.courses?.course_code || "N/A",
            courseTitle: item.courses?.course_name || "",
            time: `${formatDisplayTime(item.start_time)} - ${formatDisplayTime(
              item.end_time,
            )}`,
            venue: item.venue || "TBD",
            students: item.student_count || 0,
            department: item.department || "N/A",
            level: item.level || "N/A",
            lecturerName: item.lecturer_name || "Not specified",
          }));

        return {
          day,
          classes: dayClasses,
        };
      });

      setWeeklySchedule(formattedSchedule);
    } catch (err) {
      console.error("Error fetching schedule data:", err);
      setError(err.message || "Could not load your courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchScheduleData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchScheduleData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-populate department, level, and lecturer name if course is selected
      if (name === "courseId") {
        const selectedCourse = availableCourses.find((c) => c.id === value);
        if (selectedCourse) {
          updated.department = selectedCourse.department || "";
          updated.level = selectedCourse.level || "";
          updated.lecturerName = selectedCourse.lecturerName || "";
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.courseId ||
      !formData.department ||
      !formData.level ||
      !formData.lecturerName ||
      !formData.day ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.venue ||
      !formData.students
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const { error: insertError } = await supabase.from("schedules").insert([
        {
          course_id: formData.courseId,
          department: formData.department,
          level: formData.level,
          lecturer_name: formData.lecturerName,
          day: formData.day,
          start_time: formData.startTime,
          end_time: formData.endTime,
          venue: formData.venue,
          student_count: Number(formData.students),
        },
      ]);

      if (insertError) throw insertError;

      // Refresh schedule view
      await fetchScheduleData();

      // Reset Form State
      setFormData({
        courseId: "",
        department: "",
        level: "",
        lecturerName: "",
        day: "",
        startTime: "",
        endTime: "",
        venue: "",
        students: "",
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError(err.message || "Failed to schedule class. Please try again.");
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
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
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

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Class Schedule
            </h1>

            <button
              type="button"
              onClick={() => {
                setError("");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Schedule Class
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary">
              <Loader2 size={24} className="mr-2 animate-spin" />
              <span className="text-sm">Loading schedule...</span>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {weeklySchedule.map((day) => (
                <article
                  key={day.day}
                  className="rounded-xl border border-border bg-surface p-3.5 shadow-sm"
                >
                  <div className="border-b border-border pb-3">
                    <h2 className="text-sm font-semibold text-text-primary">
                      {day.day}
                    </h2>
                  </div>

                  <div className="mt-3 space-y-2">
                    {day.classes.length === 0 ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-text-secondary">
                        <CalendarDays size={14} />
                        <span>No classes scheduled</span>
                      </div>
                    ) : (
                      day.classes.map((classItem) => (
                        <div
                          key={classItem.id}
                          className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-blue-700">
                                {classItem.course}
                              </h3>
                              {classItem.courseTitle && (
                                <p className="mt-0.5 text-[11px] text-blue-700/80">
                                  {classItem.courseTitle}
                                </p>
                              )}
                            </div>
                            <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                              {classItem.department} ({classItem.level})
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-medium text-blue-600">
                            {classItem.time}
                          </p>

                          <p className="mt-1 text-xs text-blue-600">
                            {classItem.venue} | {classItem.students} students
                          </p>

                          <div className="mt-2 border-t border-blue-200/80 pt-1.5 text-[11px] font-semibold text-blue-800">
                            Lecturer: {classItem.lecturerName}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl scrollbar-none">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Schedule New Class
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Add a class to your weekly schedule for student views.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-text-secondary transition hover:bg-background"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Course Selector */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Course
                </label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Select course</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
                {!loading && availableCourses.length === 0 && (
                  <p className="mt-1.5 text-xs text-text-secondary">
                    No courses are assigned to this lecturer yet. Create one
                    from the Courses page first.
                  </p>
                )}
              </div>

              {/* Department Selector */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Select department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Cyber Security">Cyber Security</option>
                  {/* Add more department options as needed */}
                </select>
              </div>

              {/* Level Selector */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Select level</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                </select>
              </div>

              {/* Lecturer Name Input */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Lecturer Name
                </label>
                <input
                  type="text"
                  name="lecturerName"
                  value={formData.lecturerName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. John Doe"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Day Selector */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Day
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Select day</option>
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g. Hall A or Lab 1"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Students */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Number of Students
                </label>
                <input
                  type="number"
                  name="students"
                  value={formData.students}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 40"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Form Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-background"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CalendarDays size={18} />
                  )}
                  {submitting ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerSchedule;