import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import LecturerHeader from "../components/lecturer/LecturerHeader";
import StatisticsCards from "../components/lecturer/StatCard";
import AttendanceCharts from "../components/lecturer/AttendanceByCourse";
import AtRiskStudentsTable from "../components/lecturer/AtRiskStudentsTable";
import { supabase } from "../supabaseClient";

const normalizeAttendanceStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

function LecturerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeSessions: 0,
    overallAttendanceRate: 0,
  });

  const navigate = useNavigate();

  // Memoize fetchDashboardStats using useCallback to keep reference stable
  const fetchDashboardStats = useCallback(async () => {
    try {
      setError(null);

      // 1. Restore the current session before reading authenticated data.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        setLoading(false);
        setError("Auth session missing!");
        navigate("/login", { replace: true });
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        setLoading(false);
        setError("Auth session missing!");
        navigate("/login", { replace: true });
        return;
      }

      // 2. Fetch courses assigned to this lecturer.
      const resolveCourseIds = async () => {
        const { data: lecturerCourses = [], error: directCoursesError } =
          await supabase
            .from("courses")
            .select("id, lecturer_id")
            .eq("lecturer_id", user.id);

        if (directCoursesError) throw directCoursesError;

        return [
          ...new Set(
            (lecturerCourses || [])
              .filter((course) => course?.lecturer_id === user.id)
              .map((course) => course.id)
              .filter(Boolean),
          ),
        ];
      };

      const courseIds = await resolveCourseIds();

      if (!courseIds.length) {
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          activeSessions: 0,
          overallAttendanceRate: 0,
        });
        setRecentAttendance([]);
        setLoading(false);
        return;
      }
      const { data: courses = [], error: coursesError } = await supabase
        .from("courses")
        .select("id, course_code")
        .in("id", courseIds);

      if (coursesError) throw coursesError;

      const totalCourses = courses.length;

      if (totalCourses === 0) {
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          activeSessions: 0,
          overallAttendanceRate: 0,
        });
        setLoading(false);
        return;
      }

      // 3. Fetch enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("course_id, student_id")
        .in("course_id", courseIds);

      if (enrollmentsError) throw enrollmentsError;

      // 4. Fetch total & open class sessions for these courses
      const { data: sessions, error: sessionsError } = await supabase
        .from("class_sessions")
        .select("id, course_id, attendance_open, session_type")
        .in("course_id", courseIds);

      if (sessionsError) throw sessionsError;

      const totalSessions = sessions?.length || 0;
      const activeSessions =
        sessions?.filter((s) => s.attendance_open).length || 0;

      const sessionIds = (sessions || []).map((s) => s.id);

      // Fetch attendance records to support fallback calculations if enrollments are empty
      const { data: attendanceRecords, error: attendanceError } =
        sessionIds.length > 0
          ? await supabase
              .from("attendance_records")
              .select("id, student_id, class_session_id, status")
              .in("class_session_id", sessionIds)
          : { data: [], error: null };

      if (attendanceError) throw attendanceError;

      // Calculate unique students
      const enrolledStudentIds = new Set(
        (enrollments || []).map((e) => e.student_id).filter(Boolean),
      );
      const attendedStudentIds = new Set(
        (attendanceRecords || []).map((r) => r.student_id).filter(Boolean),
      );

      const totalStudents =
        enrolledStudentIds.size > 0
          ? enrolledStudentIds.size
          : attendedStudentIds.size;

      // 5. Calculate overall attendance percentage safely
      let overallAttendanceRate = 0;
      if (totalSessions > 0) {
        const studentsByCourse = new Map();
        if (enrolledStudentIds.size > 0) {
          (enrollments || []).forEach(({ course_id }) => {
            studentsByCourse.set(
              course_id,
              (studentsByCourse.get(course_id) || 0) + 1,
            );
          });
        } else {
          sessions.forEach((session) => {
            const courseAttendees = new Set(
              (attendanceRecords || [])
                .filter((r) => r.class_session_id === session.id)
                .map((r) => r.student_id),
            );
            studentsByCourse.set(
              session.course_id,
              Math.max(1, courseAttendees.size),
            );
          });
        }

        const totalPossibleAttendance = sessions.reduce(
          (total, session) =>
            total + (studentsByCourse.get(session.course_id) || 0),
          0,
        );

        const attendanceSet = new Set(
          (attendanceRecords || [])
            .filter((record) => {
              const status = normalizeAttendanceStatus(record.status);
              return status === "present" || status === "late";
            })
            .map((record) => `${record.class_session_id}:${record.student_id}`),
        );

        const totalPresent = attendanceSet.size;

        if (totalPossibleAttendance > 0) {
          overallAttendanceRate = Math.min(
            100,
            Math.round((totalPresent / totalPossibleAttendance) * 100),
          );
        } else if (totalPresent > 0) {
          overallAttendanceRate = 100;
        }
      }

      // 6. Load recent attendance activity
      let recentEntries = [];

      if (sessionIds.length > 0) {
        const { data: attendanceActivity, error: activityError } =
          await supabase
            .from("attendance_records")
            .select("id, student_id, class_session_id, status, marked_at")
            .in("class_session_id", sessionIds)
            .order("marked_at", { ascending: false })
            .limit(8);

        if (activityError) throw activityError;

        const uniqueStudentIds = [
          ...new Set(
            (attendanceActivity || [])
              .map((record) => record.student_id)
              .filter(Boolean),
          ),
        ];

        let profiles = [];
        if (uniqueStudentIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", uniqueStudentIds);

          if (profileError) throw profileError;
          profiles = profileData || [];
        }

        const profileMap = new Map(
          profiles.map((profile) => [
            profile.id,
            profile.full_name || "Student",
          ]),
        );

        const courseMap = new Map(
          (courses || []).map((course) => [
            course.id,
            course.course_code || "Course",
          ]),
        );

        const sessionMap = new Map(
          (sessions || []).map((session) => [
            session.id,
            {
              course: courseMap.get(session.course_id) || "Course",
              type: session.session_type || "Lecture",
            },
          ]),
        );

        recentEntries = (attendanceActivity || [])
          .filter((record) =>
            ["present", "late"].includes((record.status || "").toLowerCase()),
          )
          .slice(0, 6)
          .map((record) => {
            const sessionInfo = sessionMap.get(record.class_session_id);
            const studentName = profileMap.get(record.student_id) || "Student";

            return {
              id: record.id,
              student: studentName,
              course: sessionInfo?.course || "Course",
              type: sessionInfo?.type || "Lecture",
              markedAt: record.marked_at
                ? new Date(record.marked_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now",
            };
          });
      }

      setStats({
        totalCourses,
        totalStudents,
        activeSessions,
        overallAttendanceRate,
      });
      setRecentAttendance(recentEntries);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on component mount wrapped correctly
    const loadDashboard = async () => {
      await fetchDashboardStats();
    };
    loadDashboard();

    // Setup Supabase Realtime channel for instant live updates without spamming server polls
    const channel = supabase
      .channel("public:attendance_records:dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_records" },
        () => {
          fetchDashboardStats();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardStats]);

  return (
    <div className="min-h-screen bg-background">
      <LecturerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <LecturerHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="space-y-8 p-4 sm:p-6 lg:p-8">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Dashboard Overview
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Monitor your courses, students, and attendance performance.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          )}

          <StatisticsCards stats={stats} loading={loading} />

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Recent attendance marks
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Live student check-ins from your open sessions.
                  </p>
                </div>
              </div>

              {recentAttendance.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-text-secondary">
                  No students have marked attendance yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttendance.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
                    >
                      <div>
                        <p className="font-semibold text-text-primary">
                          {entry.student}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {entry.course} • {entry.type}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Present
                        </span>
                        <p className="mt-1 text-xs text-text-secondary">
                          {entry.markedAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary">
                Attendance pulse
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Students who have checked in to your active sessions appear
                here.
              </p>

              <div className="mt-5 rounded-xl bg-emerald-50 p-4">
                <div className="text-3xl font-bold text-emerald-700">
                  {recentAttendance.length}
                </div>
                <p className="mt-1 text-sm text-emerald-700">
                  attendance marks in recent activity
                </p>
              </div>
            </div>
          </div>

          <AttendanceCharts />
          <AtRiskStudentsTable />
        </main>
      </div>
    </div>
  );
}

export default LecturerDashboard;
