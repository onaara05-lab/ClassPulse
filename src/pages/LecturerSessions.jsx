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
    const fetchInitialData = async () => {
      try {
        setLoading(true);

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
          .select("id, code, title")
          .eq("lecturer_id", user.id);

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        const courseIds = (coursesData || []).map((c) => c.id);

        if (courseIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }

        // 2. Fetch sessions corresponding to lecturer's courses
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`
            id,
            type,
            session_date,
            start_time,
            present_count,
            total_students,
            window_minutes,
            status,
            created_at,
            courses (id, code)
          `)
          .in("course_id", courseIds)
          .order("created_at", { ascending: false });

        if (sessionsError) throw sessionsError;

        // Map sessions database record to UI presentation format
        const formattedSessions = (sessionsData || []).map((s) => ({
          id: s.id,
          course: s.courses?.code || "N/A",
          type: s.type || "Lecture",
          date: formatDate(s.session_date),
          time: formatTime(s.start_time),
          present: s.present_count || 0,
          total: s.total_students || 0,
          window: `${s.window_minutes} min`,
          status: s.status || "Closed",
        }));

        setSessions(formattedSessions);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
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

      const { data, error: insertError } = await supabase
        .from("sessions")
        .insert([
          {
            course_id: formData.courseId,
            type: formData.type,
            session_date: formData.date,
            start_time: formData.time,
            window_minutes: Number(formData.window),
            total_students: Number(formData.total),
            present_count: 0,
            status: "Open",
          },
        ])
        .select(`
          id,
          type,
          session_date,
          start_time,
          present_count,
          total_students,
          window_minutes,
          status,
          courses (id, code)
        `)
        .single();

      if (insertError) throw insertError;

      const createdSession = {
        id: data.id,
        course: data.courses?.code || "N/A",
        type: data.type,
        date: formatDate(data.session_date),
        time: formatTime(data.start_time),
        present: 0,
        total: Number(data.total_students),
        window: `${data.window_minutes} min`,
        status: "Open",
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
          .from("sessions")
          .update({ status: "Closed" })
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