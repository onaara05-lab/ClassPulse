import { useEffect, useState } from "react";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import LecturerHeader from "../components/lecturer/LecturerHeader";
import StatisticsCards from "../components/lecturer/StatCard";
import AttendanceCharts from "../components/lecturer/AttendanceByCourse";
import AtRiskStudentsTable from "../components/lecturer/AtRiskStudentsTable";
import { supabase } from "../supabaseClient";

function LecturerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeSessions: 0,
    overallAttendanceRate: 0,
  });

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);
        setError(null);

        // 1. Get authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No active session found.");

        // 2. Fetch courses assigned to this lecturer
        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select("id")
          .eq("lecturer_id", user.id);

        if (coursesError) throw coursesError;

        const courseIds = courses?.map((c) => c.id) || [];
        const totalCourses = courseIds.length;

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

        // 3. Fetch unique enrolled students across those courses
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("course_id, student_id")
          .in("course_id", courseIds);

        if (enrollmentsError) throw enrollmentsError;

        const uniqueStudents = new Set(enrollments?.map((e) => e.student_id));
        const totalStudents = uniqueStudents.size;

        // 4. Fetch total & open class sessions for these courses
        const { data: sessions, error: sessionsError } = await supabase
          .from("class_sessions")
          .select("id, course_id, attendance_open")
          .in("course_id", courseIds);

        if (sessionsError) throw sessionsError;

        const totalSessions = sessions?.length || 0;
        const activeSessions =
          sessions?.filter((s) => s.attendance_open).length || 0;

        // 5. Calculate overall attendance percentage
        let overallAttendanceRate = 0;
        if (totalSessions > 0 && totalStudents > 0) {
          const sessionIds = sessions.map((s) => s.id);
          const { data: attendanceRecords, error: attendanceError } =
            await supabase
              .from("attendance_records")
              .select("id")
              .in("class_session_id", sessionIds)
              .eq("status", "present");

          if (attendanceError) throw attendanceError;

          const studentsByCourse = new Map();
          (enrollments || []).forEach(({ course_id }) => {
            studentsByCourse.set(
              course_id,
              (studentsByCourse.get(course_id) || 0) + 1,
            );
          });
          const totalPossibleAttendance = sessions.reduce(
            (total, session) =>
              total + (studentsByCourse.get(session.course_id) || 0),
            0,
          );
          const totalPresent = attendanceRecords?.length || 0;
          overallAttendanceRate = Math.round(
            (totalPresent / totalPossibleAttendance) * 100
          );
        }

        setStats({
          totalCourses,
          totalStudents,
          activeSessions,
          overallAttendanceRate,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err.message || "Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LecturerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <LecturerHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="space-y-8 p-4 sm:p-6 lg:p-8">
          {/* Page Introduction */}
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

          {/* Statistics Cards */}
          <StatisticsCards stats={stats} loading={loading} />

          {/* Charts */}
          <AttendanceCharts />

          {/* Students At Risk */}
          <AtRiskStudentsTable />
        </main>
      </div>
    </div>
  );
}

export default LecturerDashboard;
