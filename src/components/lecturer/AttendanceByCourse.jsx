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

const normalizeAttendanceStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

function AttendanceCharts() {
  const [courseAttendanceData, setCourseAttendanceData] = useState([]);
  const [attendanceTrendData, setAttendanceTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function resolveLecturerCourseIds(user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const candidateNames = [
        profileData?.full_name,
        user.user_metadata?.full_name,
        user.user_metadata?.name,
        user.email?.split("@")[0],
      ]
        .map((value) => value?.trim())
        .filter(Boolean);

      const { data: lecturerCourses = [] } = await supabase
        .from("courses")
        .select("id")
        .eq("lecturer_id", user.id);

      let courseIds = [
        ...new Set((lecturerCourses || []).map((course) => course.id)),
      ];

      for (const candidateName of [...new Set(candidateNames)]) {
        if (courseIds.length > 0) break;

        const { data: namedCourses = [] } = await supabase
          .from("courses")
          .select("id")
          .eq("lecturer_name", candidateName);

        courseIds = [
          ...new Set([
            ...courseIds,
            ...namedCourses.map((course) => course.id),
          ]),
        ];
      }

      if (courseIds.length === 0) {
        const { data: openSessions = [] } = await supabase
          .from("class_sessions")
          .select("course_id, courses ( lecturer_id, lecturer_name )")
          .eq("attendance_open", true);

        const candidateSet = new Set(
          candidateNames.map((name) => name.toLowerCase()),
        );
        courseIds = [
          ...new Set(
            (openSessions || [])
              .filter((session) => {
                const course = session.courses;
                if (!course) return false;

                return (
                  course.lecturer_id === user.id ||
                  (course.lecturer_name &&
                    candidateSet.has(course.lecturer_name.toLowerCase()))
                );
              })
              .map((session) => session.course_id)
              .filter(Boolean),
          ),
        ];
      }

      return [...new Set(courseIds)];
    }

    async function fetchChartData() {
      try {
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user.");

        const courseIds = await resolveLecturerCourseIds(user);

        if (!courseIds || courseIds.length === 0) {
          if (isMounted) {
            setCourseAttendanceData([]);
            setAttendanceTrendData([]);
            setLoading(false);
          }
          return;
        }

        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .in("id", courseIds);

        if (coursesError) throw coursesError;

        if (!courses || courses.length === 0) {
          if (isMounted) {
            setCourseAttendanceData([]);
            setAttendanceTrendData([]);
            setLoading(false);
          }
          return;
        }

        const resolvedCourseIds = courses.map((c) => c.id);

        // Fetch enrollments
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id, student_id")
          .in("course_id", resolvedCourseIds);

        const studentCountByCourse = {};
        enrollments?.forEach((e) => {
          studentCountByCourse[e.course_id] =
            (studentCountByCourse[e.course_id] || 0) + 1;
        });

        // Fetch sessions
        const { data: sessions, error: sessionsErr } = await supabase
          .from("class_sessions")
          .select("id, course_id, session_date")
          .in("course_id", resolvedCourseIds)
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

        // Fetch attendance records
        const { data: records, error: recordsErr } = await supabase
          .from("attendance_records")
          .select("class_session_id, student_id, status")
          .in("class_session_id", sessionIds);

        if (recordsErr) throw recordsErr;

        // Map records back to course via sessions for fallback unique attendee calculation
        const sessionToCourseMap = {};
        sessions.forEach((s) => {
          sessionToCourseMap[s.id] = s.course_id;
        });

        const presentCountBySession = {};
        const uniqueAttendeesPerCourse = {};
        const seenAttendance = new Set();

        records?.forEach((r) => {
          const status = normalizeAttendanceStatus(r.status);
          if (status !== "present" && status !== "late") return;

          const courseId = sessionToCourseMap[r.class_session_id];
          const uniqueKey = `${courseId}:${r.class_session_id}:${r.student_id}`;
          if (seenAttendance.has(uniqueKey)) return;
          seenAttendance.add(uniqueKey);

          presentCountBySession[r.class_session_id] =
            (presentCountBySession[r.class_session_id] || 0) + 1;

          if (courseId) {
            if (!uniqueAttendeesPerCourse[courseId]) {
              uniqueAttendeesPerCourse[courseId] = new Set();
            }
            if (r.student_id) {
              uniqueAttendeesPerCourse[courseId].add(r.student_id);
            }
          }
        });

        // --- Calculate Bar Chart Data ---
        const courseMap = {};
        sessions.forEach((session) => {
          if (!courseMap[session.course_id]) {
            courseMap[session.course_id] = {
              totalSessions: 0,
              totalPresent: 0,
            };
          }
          courseMap[session.course_id].totalSessions += 1;
          courseMap[session.course_id].totalPresent +=
            presentCountBySession[session.id] || 0;
        });

        const barData = courses.map((c) => {
          const stats = courseMap[c.id];
          // Fallback to unique attendees if formal enrollments table is empty so it doesn't divide by zero
          const enrolledStudents =
            studentCountByCourse[c.id] ||
            (uniqueAttendeesPerCourse[c.id]
              ? uniqueAttendeesPerCourse[c.id].size
              : 0);

          let attendance = 0;
          if (stats && stats.totalSessions > 0 && enrolledStudents > 0) {
            const possible = stats.totalSessions * enrolledStudents;
            // Cap attendance percentage at 100% max
            attendance = Math.min(
              100,
              Math.round((stats.totalPresent / possible) * 100),
            );
          } else if (stats && stats.totalPresent > 0) {
            // If records exist but denominator defaults cleanly, show 100% or relative activity indicator
            attendance = 100;
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

          const enrolledInCourse =
            studentCountByCourse[s.course_id] ||
            (uniqueAttendeesPerCourse[s.course_id]
              ? uniqueAttendeesPerCourse[s.course_id].size
              : 1);
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
              ? Math.min(
                  100,
                  Math.round((item.totalPresent / item.totalPossible) * 100),
                )
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
    const refreshId = window.setInterval(fetchChartData, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshId);
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
