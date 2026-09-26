import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { LuRefreshCw } from "react-icons/lu";
import { supabase } from "../../supabaseClient";

function AttendanceCharts() {
  const [courseAttendanceData, setCourseAttendanceData] = useState([]);
  const [attendanceTrendData, setAttendanceTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchChartData() {
      try {
        setError(null);

        // 1. Get authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user.");

        // 2. Fetch courses taught by the lecturer
        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .eq("lecturer_id", user.id);

        if (coursesError) throw coursesError;

        if (!courses || courses.length === 0) {
          if (isMounted) {
            setCourseAttendanceData([]);
            setAttendanceTrendData([]);
            setLoading(false);
          }
          return;
        }

        const courseIds = courses.map((c) => c.id);

        // 3. Fetch enrollments
        const { data: enrollments, error: enrollmentsErr } = await supabase
          .from("enrollments")
          .select("course_id, student_id")
          .in("course_id", courseIds);

        if (enrollmentsErr) throw enrollmentsErr;

        const studentCountByCourse = {};
        enrollments?.forEach((e) => {
          studentCountByCourse[e.course_id] =
            (studentCountByCourse[e.course_id] || 0) + 1;
        });

        // 4. Fetch class sessions
        const { data: sessions, error: sessionsErr } = await supabase
          .from("class_sessions")
          .select("id, course_id, session_date")
          .in("course_id", courseIds)
          .order("session_date", { ascending: true });

        if (sessionsErr) throw sessionsErr;

        if (!sessions || sessions.length === 0) {
          if (isMounted) {
            setCourseAttendanceData([]);
            setAttendanceTrendData([]);
            setLoading(false);
          }
          return;
        }

        const sessionIds = sessions.map((s) => s.id);

        // 5. Fetch present records
        const { data: records, error: recordsErr } = await supabase
          .from("attendance_records")
          .select("class_session_id, status")
          .in("class_session_id", sessionIds)
          .eq("status", "present");

        if (recordsErr) throw recordsErr;

        const presentCountBySession = {};
        records?.forEach((r) => {
          presentCountBySession[r.class_session_id] =
            (presentCountBySession[r.class_session_id] || 0) + 1;
        });

        // --- Calculate Bar Chart Data ---
        const courseMap = {};
        sessions.forEach((session) => {
          if (!courseMap[session.course_id]) {
            courseMap[session.course_id] = { totalSessions: 0, totalPresent: 0 };
          }
          courseMap[session.course_id].totalSessions += 1;
          courseMap[session.course_id].totalPresent +=
            presentCountBySession[session.id] || 0;
        });

        const barData = courses.map((c) => {
          const stats = courseMap[c.id];
          const enrolledStudents = studentCountByCourse[c.id] || 0;

          let attendance = 0;
          if (stats && stats.totalSessions > 0 && enrolledStudents > 0) {
            const possible = stats.totalSessions * enrolledStudents;
            attendance = Math.round((stats.totalPresent / possible) * 100);
          }

          return {
            course: c.course_code,
            attendance,
          };
        });

        // --- Calculate Line Chart Data ---
        const trendMap = {};
        sessions.forEach((s) => {
          const dateKey = s.session_date
            ? new Date(s.session_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "Session " + s.id.slice(0, 4);

          const enrolledInCourse = studentCountByCourse[s.course_id] || 0;
          const present = presentCountBySession[s.id] || 0;

          if (!trendMap[dateKey]) {
            trendMap[dateKey] = { totalPresent: 0, totalPossible: 0 };
          }
          trendMap[dateKey].totalPresent += present;
          trendMap[dateKey].totalPossible += enrolledInCourse;
        });

        const lineData = Object.keys(trendMap).map((dateKey) => {
          const item = trendMap[dateKey];
          const attendance =
            item.totalPossible > 0
              ? Math.round((item.totalPresent / item.totalPossible) * 100)
              : 0;
          return {
            week: dateKey,
            attendance,
          };
        });

        if (isMounted) {
          setCourseAttendanceData(barData);
          setAttendanceTrendData(lineData);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        if (isMounted) {
          setError(err.message || "Failed to load attendance charts.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchChartData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12 text-text-secondary">
        <LuRefreshCw className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Loading analytics charts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Attendance Overview Chart */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Attendance Overview
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Average attendance performance over time.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {attendanceTrendData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-text-secondary">
              No session data available to plot trend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance Rate"
                  stroke="#045389"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Course Attendance Comparison Chart */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Course Attendance Comparison
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Attendance rate across your courses.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {courseAttendanceData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-text-secondary">
              No course data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="course"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                <Legend />
                <Bar
                  dataKey="attendance"
                  name="Attendance Rate"
                  fill="#38BDF8"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}

export default AttendanceCharts;