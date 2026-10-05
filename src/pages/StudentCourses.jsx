import { useState, useEffect, useCallback } from "react";
import { LuMenu, LuLoader, LuBookOpen } from "react-icons/lu";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";

function StudentCourses() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStudentCourses = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      setError("");

      // 1. Get authenticated student
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      // 2. Fetch student enrollments / registrations
      const { data: enrollmentResult, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      if (enrollmentError) throw enrollmentError;

      const enrolledCourseIds = (enrollmentResult || []).map(
        (enrollment) => enrollment.course_id
      );

      if (enrolledCourseIds.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // 3. Fetch only the courses the student is registered for
      const { data: rawCourses, error: coursesError } = await supabase
        .from("courses")
        .select("id, course_code, course_name, department, level")
        .in("id", enrolledCourseIds)
        .order("course_code", { ascending: true });

      if (coursesError) throw coursesError;

      const displayCourses = rawCourses || [];
      const courseIds = displayCourses.map((course) => course.id);

      // 4. Safely fetch class sessions for these courses
      let sessionsData = [];
      if (courseIds.length > 0) {
        const { data: sessions, error: sessionsError } = await supabase
          .from("class_sessions")
          .select("id, course_id")
          .in("course_id", courseIds);

        if (sessionsError) {
          console.warn("Sessions fetch warning:", sessionsError.message);
        } else {
          sessionsData = sessions || [];
        }
      }

      // 5. Safely fetch attendance records for this student
      let attendanceData = [];
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("status, class_session_id")
        .eq("student_id", user.id);

      if (attendanceError) {
        console.warn(
          "Attendance records fetch warning:",
          attendanceError.message
        );
      } else {
        attendanceData = attendance || [];
      }

      // 6. Calculate attendance percentage and breakdown per registered course
      const processedCourses = displayCourses.map((course) => {
        const courseSessionIds = sessionsData
          .filter((session) => session.course_id === course.id)
          .map((session) => session.id);

        const total = courseSessionIds.length;
        const attended = attendanceData.filter(
          (record) =>
            courseSessionIds.includes(record.class_session_id) &&
            record.status?.toLowerCase() === "present"
        ).length;
        const missed = Math.max(0, total - attended);

        const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

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
          department: course.department,
          level: course.level,
          percent,
          attended,
          missed,
          total,
          badgeBg,
          badgeText,
          barColor,
        };
      });

      setCourses(processedCourses);
    } catch (err) {
      console.error("Error fetching registered courses:", err);
      setError(err.message || "Could not load your registered courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudentCourses(true);
    }, 0);

    return () => clearTimeout(timer);
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
        <div className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text-primary"
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
              <span className="text-lg font-bold text-text-primary">
                ClassPulse
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                My Registered Courses
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                View your registered courses and monitor your attendance standing.
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Courses Grid or State Views */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary">
              <LuLoader className="mr-2 h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Loading your registered courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-16 text-center">
              <LuBookOpen className="mb-3 h-10 w-10 text-slate-400" />
              <p className="font-semibold text-text-primary">
                No registered courses found
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                You have not registered for any courses yet. Please visit the course registration page to add courses.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Course Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-text-primary">
                          {course.code}
                        </h2>
                        <p className="mt-1 text-xs font-medium text-text-primary">
                          {course.title}
                        </p>
                        {course.department && (
                          <p className="mt-1 text-xs text-text-secondary">
                            {course.department} {course.level ? `• ${course.level}` : ""}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${course.badgeBg} ${course.badgeText}`}
                      >
                        {course.percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${course.barColor}`}
                          style={{ width: `${course.percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="mt-4 flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-border/50">
                      <span>{course.attended} attended</span>
                      <span>{course.missed} missed</span>
                      <span>{course.total} total sessions</span>
                    </div>
                  </div>
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