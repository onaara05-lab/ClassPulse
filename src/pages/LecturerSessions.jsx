import { useState, useEffect, useCallback } from "react";
import { Plus, X, Menu, Activity, Radio, Loader2 } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import NewSessionModal from "../components/lecturer/NewSessionModal";
import { supabase } from "../supabaseClient";

// Outer helper functions
const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${period}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const formatted = new Date(`${dateStr}T00:00:00`);
  return formatted.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeAttendanceStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

function LecturerSessions() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tracks active session state for active live modal view or banner
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState("");

  const handleCloseSession = useCallback(
    async (sessionId) => {
      const targetId =
        typeof sessionId === "string" ? sessionId : activeSession?.id;
      if (!targetId) return;

      try {
        const { error: updateError } = await supabase
          .from("class_sessions")
          .update({ attendance_open: false, is_active: false })
          .eq("id", targetId);

        if (updateError) throw updateError;

        setSessions((prev) =>
          prev.map((s) => (s.id === targetId ? { ...s, status: "Closed" } : s)),
        );
      } catch (err) {
        console.error("Error closing session:", err);
        setError(err.message || "Failed to close session.");
      } finally {
        setActiveSession(null);
      }
    },
    [activeSession],
  );

  const fetchInitialData = useCallback(async (initialLoad = false) => {
    try {
      if (initialLoad) setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        setSessions([]);
        setLoading(false);
        return;
      }

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
            .select("id, course_code, course_name, total_students")
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
              .select("id, course_code, course_name, total_students")
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

        const coursesData = await supabase
          .from("courses")
          .select("id, course_code, course_name, total_students")
          .in(
            "id",
            courseIds.length > 0
              ? courseIds
              : ["00000000-0000-0000-0000-000000000000"],
          );

        return {
          courseIds,
          coursesData: coursesData.data || [],
        };
      };

      const { courseIds, coursesData } = await resolveLecturerCourseIds();
      const lecturerCourses = coursesData || [];
      const mappedCourses = lecturerCourses.map((course) => ({
        id: course.id,
        code: course.course_code,
        title: course.course_name,
        totalStudents: course.total_students || 0,
      }));

      setCourses(mappedCourses);

      if (courseIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("class_sessions")
        .select(
          `
          id,
          course_id,
          session_date,
          start_time,
          end_time,
          session_type,
          attendance_open,
          is_active,
          expires_at,
          created_at,
          courses (id, course_code, total_students)
        `,
        )
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      const currentActive = (sessionsData || []).find(
        (s) => s.is_active && s.attendance_open,
      );

      if (currentActive) {
        const courseCode =
          currentActive.courses?.course_code ||
          mappedCourses.find((c) => c.id === currentActive.course_id)?.code ||
          "N/A";

        setActiveSession((prev) =>
          prev?.id === currentActive.id
            ? prev
            : {
                id: currentActive.id,
                course: courseCode,
                type: currentActive.session_type || "Lecture",
                expires_at: currentActive.expires_at,
              },
        );
      } else {
        setActiveSession(null);
      }

      const sessionIds = (sessionsData || []).map((session) => session.id);

      // FIXED: Added student_id to the select fields below
      const { data: attendanceRecords, error: attendanceError } =
        sessionIds.length > 0
          ? await supabase
              .from("attendance_records")
              .select("class_session_id, status, student_id")
              .in("class_session_id", sessionIds)
          : { data: [], error: null };

      if (attendanceError) throw attendanceError;

      const formattedSessions = (sessionsData || []).map((s) => {
        const courseId = s.course_id ?? s.courses?.id;
        const matchedCourse = mappedCourses.find((course) => course.id === courseId);
        const courseCode = s.courses?.course_code || matchedCourse?.code || "N/A";

        const totalCount = s.courses?.total_students ?? matchedCourse?.totalStudents ?? 0;

        const presentSet = new Set(
          (attendanceRecords || [])
            .filter((record) => {
              if (record.class_session_id !== s.id) return false;
              const status = normalizeAttendanceStatus(record.status);
              return status === "present" || status === "late";
            })
            .map((record) => record.student_id)
            .filter(Boolean),
        );

        const presentCount = presentSet.size;

        return {
          id: s.id,
          course: courseCode,
          type: s.session_type || "Lecture",
          date: formatDate(s.session_date),
          time: formatTime(s.start_time),
          present: presentCount,
          total: totalCount,
          window:
            s.start_time && s.end_time
              ? `${Math.max(
                  0,
                  Math.round(
                    (new Date(`1970-01-01T${s.end_time}`) -
                      new Date(`1970-01-01T${s.start_time}`)) /
                      60000,
                  ),
                )} min`
              : "N/A",
          status: s.attendance_open && s.is_active ? "Open" : "Closed",
        };
      });

      setSessions(formattedSessions);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err.message || "Failed to load attendance sessions.");
    } finally {
      if (initialLoad) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialData(true);
    }, 0);

    const refreshInterval = window.setInterval(
      () => fetchInitialData(false),
      15000,
    );

    return () => {
      clearTimeout(timer);
      window.clearInterval(refreshInterval);
    };
  }, [fetchInitialData]);

  useEffect(() => {
    if (!activeSession || !activeSession.expires_at) return;

    const expiresTime = new Date(activeSession.expires_at).getTime();
    const currentTime = Date.now();
    const timeLeft = expiresTime - currentTime;

    let timer;

    if (timeLeft <= 0) {
      timer = setTimeout(() => {
        handleCloseSession(activeSession.id);
      }, 0);
    } else {
      timer = setTimeout(() => {
        handleCloseSession(activeSession.id);
      }, timeLeft);
    }

    return () => clearTimeout(timer);
  }, [activeSession, handleCloseSession]);

  const handleSessionCreated = (data) => {
    const createdSession = {
      id: data.id,
      course: data.courses?.course_code || "N/A",
      type: data.session_type,
      date: formatDate(data.session_date),
      time: formatTime(data.start_time),
      present: 0,
      total: data.courses?.total_students || 0,
      window: "15 min",
      status: "Open",
    };

    setSessions((prev) => [createdSession, ...prev]);
    setActiveSession({
      id: data.id,
      course: createdSession.course,
      type: data.session_type,
      expires_at: data.expires_at,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <LecturerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
        {/* Mobile Header */}
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Attendance Sessions
            </h1>

            <button
              type="button"
              onClick={() => {
                if (activeSession) return;
                setIsModalOpen(true);
              }}
              disabled={!!activeSession}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                activeSession
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-primary hover:opacity-90"
              }`}
            >
              {!activeSession && <Plus size={18} />}
              {activeSession ? "● Session Active" : "+ New Session"}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-text-secondary">
                <Loader2 size={24} className="mr-2 animate-spin" />
                <span className="text-sm">Loading attendance sessions...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left"
                  style={{ minWidth: "950px" }}
                >
                  <thead className="border-b border-border bg-background">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Session ID
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Course
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Type
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Time
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Present / Total
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Window
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-4 py-8 text-center text-sm text-text-secondary"
                        >
                          No attendance sessions created yet.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session) => {
                        const percentage = session.total
                          ? Math.round((session.present / session.total) * 100)
                          : 0;

                        return (
                          <tr
                            key={session.id}
                            className="transition hover:bg-background"
                          >
                            <td className="px-4 py-3 text-xs font-mono text-text-secondary">
                              {session.id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-text-primary">
                              {session.course}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {session.type}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {session.date}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {session.time}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="font-semibold text-text-primary">
                                {session.present}
                              </span>
                              <span className="text-text-secondary">
                                {" "}
                                / {session.total} ({percentage}%)
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                              {session.window}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                  session.status === "Open"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {session.status === "Open" && (
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                )}
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courses={courses}
        onSessionCreated={handleSessionCreated}
      />

      {/* Active Session Management Modal Banner */}
      {activeSession && !isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl transition-all">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Active Session
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your currently live attendance session.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal banner"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                <Activity size={38} className="animate-pulse" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {activeSession.course} Session Active
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {activeSession.type} - Students can now mark attendance
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live Session Open
              </div>

              <button
                type="button"
                onClick={() => handleCloseSession(activeSession.id)}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
              >
                <Radio size={18} />
                Close Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerSessions;