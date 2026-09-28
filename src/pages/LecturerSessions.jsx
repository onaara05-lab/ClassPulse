import { useState, useEffect } from "react";
import { Plus, X, Menu, Activity, Radio, Loader2 } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
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

function LecturerSessions() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tracks active session state for active live modal view
  const [activeSession, setActiveSession] = useState(null);

  const [formData, setFormData] = useState({
    courseId: "",
    type: "",
    date: "",
    time: "",
    window: "",
    total: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    let initialLoad = true;
    const fetchInitialData = async () => {
      try {
        if (initialLoad) setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // 1. Fetch lecturer's courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .eq("lecturer_id", user.id);

        if (coursesError) throw coursesError;
        const lecturerCourses = coursesData || [];
        setCourses(lecturerCourses.map((course) => ({
          id: course.id,
          code: course.course_code,
          title: course.course_name,
        })));

        const courseIds = lecturerCourses.map((course) => course.id);

        if (courseIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }

        // 2. Fetch sessions corresponding to lecturer's courses
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("class_sessions")
          .select(`
            id,
            session_date,
            start_time,
            end_time,
            session_type,
            attendance_open,
            created_at,
            courses (id, course_code)
          `)
          .in("course_id", courseIds)
          .order("created_at", { ascending: false });

        if (sessionsError) throw sessionsError;

        const sessionIds = (sessionsData || []).map((session) => session.id);
        const { data: enrollments, error: enrollmentsError } =
          await supabase
            .from("enrollments")
            .select("course_id, student_id")
            .in("course_id", courseIds);
        if (enrollmentsError) throw enrollmentsError;

        const { data: attendanceRecords, error: attendanceError } =
          sessionIds.length > 0
            ? await supabase
                .from("attendance_records")
                .select("class_session_id, status")
                .in("class_session_id", sessionIds)
            : { data: [], error: null };
        if (attendanceError) throw attendanceError;

        const studentCountByCourse = new Map();
        (enrollments || []).forEach(({ course_id }) => {
          studentCountByCourse.set(
            course_id,
            (studentCountByCourse.get(course_id) || 0) + 1,
          );
        });

        // Map sessions database record to UI presentation format
        const formattedSessions = (sessionsData || []).map((s) => ({
          id: s.id,
          course: s.courses?.course_code || "N/A",
          type: s.session_type || "Lecture",
          date: formatDate(s.session_date),
          time: formatTime(s.start_time),
          present: (attendanceRecords || []).filter(
            (record) =>
              record.class_session_id === s.id &&
              record.status?.toLowerCase() === "present",
          ).length,
          total: studentCountByCourse.get(s.courses?.id) || 0,
          window: s.start_time && s.end_time
            ? `${Math.round(
                (new Date(`1970-01-01T${s.end_time}`) -
                  new Date(`1970-01-01T${s.start_time}`)) /
                  60000,
              )} min`
            : "N/A",
          status: s.attendance_open ? "Open" : "Closed",
        }));

        setSessions(formattedSessions);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        if (initialLoad) {
          setLoading(false);
          initialLoad = false;
        }
      }
    };

    fetchInitialData();
    const refreshInterval = window.setInterval(fetchInitialData, 10000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.courseId ||
      !formData.type ||
      !formData.date ||
      !formData.time ||
      !formData.window ||
      !formData.total
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + Number(formData.window) * 60_000,
      );
      const { data, error: insertError } = await supabase
        .from("class_sessions")
        .insert([
          {
            course_id: formData.courseId,
            session_type: formData.type,
            session_date: formData.date,
            start_time: formData.time,
            end_time: endDateTime.toTimeString().slice(0, 8),
            duration_minutes: Number(formData.window),
            expires_at: endDateTime.toISOString(),
            attendance_open: true,
            is_active: true,
          },
        ])
        .select(`
          id,
          session_date,
          start_time,
          end_time,
          session_type,
          attendance_open,
          courses (id, course_code)
        `)
        .single();

      if (insertError) throw insertError;

      const createdSession = {
        id: data.id,
        course: data.courses?.course_code || "N/A",
        type: data.session_type,
        date: formatDate(data.session_date),
        time: formatTime(data.start_time),
        present: 0,
        total: Number(formData.total),
        window: `${formData.window} min`,
        status: data.attendance_open ? "Open" : "Closed",
      };

      setSessions((prev) => [createdSession, ...prev]);
      setActiveSession(createdSession);

      setFormData({
        courseId: "",
        type: "",
        date: "",
        time: "",
        window: "",
        total: "",
      });
    } catch (err) {
      console.error("Error opening session:", err);
      setError(err.message || "Failed to open attendance session.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSession = async () => {
    if (activeSession) {
      try {
        const { error: updateError } = await supabase
          .from("class_sessions")
          .update({ attendance_open: false, is_active: false })
          .eq("id", activeSession.id);

        if (updateError) throw updateError;

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id ? { ...s, status: "Closed" } : s
          )
        );
      } catch (err) {
        console.error("Error closing session:", err);
      }
    }
    setActiveSession(null);
    setIsModalOpen(false);
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
              Attendance Sessions
            </h1>

            <button
              type="button"
              onClick={() => {
                setError("");
                setActiveSession(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Open Session
            </button>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-text-secondary">
                <Loader2 size={24} className="mr-2 animate-spin" />
                <span className="text-sm">Loading attendance sessions...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
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

      {/* Modal View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl transition-all scrollbar-none">
            {activeSession ? (
              <div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-text-primary">
                    New Attendance Session
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Open a time-limited session for students to mark attendance.
                  </p>
                </div>

                <div className="my-8 flex flex-col items-center text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-50 text-emerald-500">
                    <Activity size={36} className="animate-pulse" />
                  </div>

                  <h3 className="text-xl font-bold text-text-primary">
                    {activeSession.course} Session Active
                  </h3>

                  <p className="mt-1.5 text-sm text-text-secondary">
                    {activeSession.type} - Students can now mark attendance
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
                    <Radio size={14} className="animate-pulse" />
                    Live Session Open
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseSession}
                  className="w-full rounded-xl bg-red-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.99]"
                >
                  Close Session
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      Open Attendance Session
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Create a new attendance session.
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
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Session Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    >
                      <option value="">Select type</option>
                      <option value="Lecture">Lecture</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Practical">Practical</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Attendance Window
                    </label>
                    <select
                      name="window"
                      value={formData.window}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    >
                      <option value="">Select window</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Total Students
                    </label>
                    <input
                      type="number"
                      name="total"
                      value={formData.total}
                      onChange={handleChange}
                      min="1"
                      placeholder="e.g. 45"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}

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
                      {submitting && (
                        <Loader2 size={18} className="animate-spin" />
                      )}
                      {submitting ? "Opening..." : "Open Session"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerSessions;
