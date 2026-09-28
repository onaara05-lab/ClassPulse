import { useState, useEffect, useCallback } from "react";
import { LuMenu, LuLoader, LuBookOpen } from "react-icons/lu";
import { Check, Plus } from "lucide-react";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";

function StudentCourses() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [error, setError] = useState("");

  const fetchStudentCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Get currently authenticated student
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      // 2. Load lecturer-created courses and identify this student's enrollments.
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, course_code, course_name")
        .order("course_code", { ascending: true });

      if (coursesError) throw coursesError;

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      if (enrollmentError) throw enrollmentError;
      const enrolledCourseIds = new Set(
        (enrollmentData || []).map((enrollment) => enrollment.course_id),
      );
      const courseIds = [...enrolledCourseIds];

      const { data: sessionsData, error: sessionsError } =
        courseIds.length > 0
          ? await supabase
              .from("class_sessions")
              .select("id, course_id")
              .in("course_id", courseIds)
          : { data: [], error: null };

      if (sessionsError) throw sessionsError;

      // 3. Fetch attendance records for this student.
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("status, class_session_id")
        .eq("student_id", user.id);

      if (attendanceError) throw attendanceError;

      // 4. Calculate attendance percentage and breakdown per course
      const processedCourses = (coursesData || []).map((course) => {
        const isEnrolled = enrolledCourseIds.has(course.id);
        const courseSessionIds = (sessionsData || [])
          .filter((session) => session.course_id === course.id)
          .map((session) => session.id);
        const total = isEnrolled ? courseSessionIds.length : 0;
        const attended = (attendanceData || []).filter(
          (record) =>
            isEnrolled &&
            courseSessionIds.includes(record.class_session_id) &&
            record.status?.toLowerCase() === "present",
        ).length;
        const missed = total - attended;

        const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

        // Dynamic styling based on attendance percentage thresholds
        let badgeBg = "bg-emerald-100";
        let badgeText = "text-emerald-700";
        let barColor = "bg-emerald-500";

        if (percent < 60) {
          badgeBg = "bg-red-100";
          badgeText = "text-red-700";
          barColor = "bg-red-500";
        } else if (percent < 75) {
          badgeBg = "bg-amber-100";
          badgeText = "text-amber-700";
          barColor = "bg-amber-500";
        }

        return {
          id: course.id,
          code: course.course_code,
          title: course.course_name,
          percent,
          attended,
          missed,
          total,
          badgeBg,
          badgeText,
          barColor,
          isEnrolled,
        };
      });

      setCourses(processedCourses);
    } catch (err) {
      console.error("Error fetching course attendance metrics:", err);
      setError(err.message || "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingCourseId(courseId);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      const { error: enrollError } = await supabase.from("enrollments").insert({
        course_id: courseId,
        student_id: user.id,
      });

      if (enrollError) throw enrollError;
      await fetchStudentCourses();
    } catch (err) {
      console.error("Error enrolling in course:", err);
      setError(err.message || "Could not enroll in this course.");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchStudentCourses();
    })();
  }, [fetchStudentCourses]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
        {/* Mobile Top Header Bar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Open sidebar"
            >
              <LuMenu size={22} />
            </button>

            {/* Mobile Logo & Brand */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <img
                  src={logo}
                  alt="ClassPulse"
                  className="h-14 w-auto object-contain sm:h-16"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                ClassPulse
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Courses
            </h1>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Courses Grid or State Views */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <LuLoader className="mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-16 text-center">
              <LuBookOpen className="mb-3 h-10 w-10 text-slate-400" />
              <p className="font-semibold text-text-primary">No courses found</p>
              <p className="mt-1 text-xs text-text-secondary">
                No lecturer-created courses are available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:shadow-md"
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">
                        {course.code}
                      </h2>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {course.title}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${course.badgeBg} ${course.badgeText}`}
                    >
                      {course.percent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${course.barColor}`}
                        style={{ width: `${course.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  {course.isEnrolled ? (
                    <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
                      <span>{course.attended} attended</span>
                      <span>{course.missed} missed</span>
                      <span>{course.total} total</span>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-text-secondary">
                      Enroll to see this course's schedule and attendance.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={course.isEnrolled || enrollingCourseId === course.id}
                    onClick={() => handleEnroll(course.id)}
                    className={`mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      course.isEnrolled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-primary text-white hover:opacity-90 disabled:opacity-60"
                    }`}
                  >
                    {course.isEnrolled ? (
                      <>
                        <Check size={16} /> Enrolled
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        {enrollingCourseId === course.id ? "Enrolling..." : "Enroll"}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentCourses;
