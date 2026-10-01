import { useState, useEffect, useCallback } from "react";
import { LuMenu, LuLoader, LuBookOpen } from "react-icons/lu";
import { Check, Plus } from "lucide-react";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizeLevel = (value) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  const match = raw.match(/(\d{1,3})/);
  return match ? match[1] : raw.replace(/\s*level\s*/g, "").replace(/\s+/g, "");
};

const matchesStudentContext = (course, student) => {
  if (!student) return true;

  const hasDepartment = Boolean(student.department);
  const hasLevel = Boolean(student.level);

  if (!hasDepartment && !hasLevel) return true;

  const departmentMatches =
    !hasDepartment ||
    normalizeValue(course.department) === normalizeValue(student.department);

  const levelMatches =
    !hasLevel || normalizeLevel(course.level) === normalizeLevel(student.level);

  return departmentMatches && levelMatches;
};

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

      // 1. Get authenticated student
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      // Fetch student profile for department and level, but do not block the page if one is missing.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("department, level")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const department =
        profile?.department || user.user_metadata?.department || "";
      const level = profile?.level || user.user_metadata?.level || "";
      const resolvedStudent = { department, level };

      // 2. Load all courses and include any course that matches the student's context or is already enrolled.
      const [coursesResult, enrollmentResult] = await Promise.all([
        supabase
          .from("courses")
          .select("id, course_code, course_name, department, level")
          .order("course_code", { ascending: true }),
        supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", user.id),
      ]);

      if (coursesResult.error) throw coursesResult.error;
      if (enrollmentResult.error) throw enrollmentResult.error;

      const enrolledCourseIds = new Set(
        (enrollmentResult.data || []).map((enrollment) => enrollment.course_id),
      );

      const filteredCourses = (coursesResult.data || []).filter(
        (course) =>
          enrolledCourseIds.has(course.id) ||
          matchesStudentContext(course, resolvedStudent),
      );

      const courseIds = filteredCourses.map((course) => course.id);

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
      const processedCourses = filteredCourses.map((course) => {
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
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex items-center justify-center py-20 text-text-secondary">
              <LuLoader className="mr-2 h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-16 text-center">
              <LuBookOpen className="mb-3 h-10 w-10 text-slate-400" />
              <p className="font-semibold text-text-primary">
                No courses found
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                No courses match your department and level yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md"
                >
                  {/* Course Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">
                        {course.code}
                      </h2>
                      <p className="mt-1 text-xs text-text-secondary">
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
                  <div className="mt-5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${course.barColor}`}
                        style={{ width: `${course.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  {course.isEnrolled ? (
                    <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                      <span>{course.attended} attended</span>
                      <span>{course.missed} missed</span>
                      <span>{course.total} total</span>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-text-secondary">
                      Enroll to see this course's schedule and attendance.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={
                      course.isEnrolled || enrollingCourseId === course.id
                    }
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
                        {enrollingCourseId === course.id
                          ? "Enrolling..."
                          : "Enroll"}
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
