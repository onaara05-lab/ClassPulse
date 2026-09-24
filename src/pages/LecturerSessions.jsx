import { useState } from "react";
import { Plus, X, Menu, Activity, Radio } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

const initialSessions = [
  {
    id: "S001",
    course: "CSC 301",
    type: "Lecture",
    date: "Sep 17, 2026",
    time: "8:00 AM",
    present: 38,
    total: 45,
    window: "15 min",
    status: "Closed",
  },
  {
    id: "S002",
    course: "CSC 401",
    type: "Lecture",
    date: "Sep 16, 2026",
    time: "10:00 AM",
    present: 30,
    total: 38,
    window: "15 min",
    status: "Closed",
  },
  {
    id: "S003",
    course: "CSC 501",
    type: "Seminar",
    date: "Sep 15, 2026",
    time: "2:00 PM",
    present: 28,
    total: 30,
    window: "20 min",
    status: "Closed",
  },
];

function LecturerSessions() {
  const [sessions, setSessions] = useState(initialSessions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tracks active session state for active live modal view
  const [activeSession, setActiveSession] = useState(null);

  const [formData, setFormData] = useState({
    course: "",
    type: "",
    date: "",
    time: "",
    window: "",
    total: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = Number(hours);

    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${period}`;
  };

  const formatDate = (date) => {
    const formatted = new Date(`${date}T00:00:00`);

    return formatted.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.course ||
      !formData.type ||
      !formData.date ||
      !formData.time ||
      !formData.window ||
      !formData.total
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const newSession = {
      id: `S${String(sessions.length + 1).padStart(3, "0")}`,
      course: formData.course,
      type: formData.type,
      date: formatDate(formData.date),
      time: formatTime(formData.time),
      present: 0,
      total: Number(formData.total),
      window: `${formData.window} min`,
      status: "Open",
    };

    setSessions((prev) => [newSession, ...prev]);

    // Set as currently active session to show active modal state
    setActiveSession(newSession);

    setFormData({
      course: "",
      type: "",
      date: "",
      time: "",
      window: "",
      total: "",
    });

    setError("");
  };

  const handleCloseSession = () => {
    if (activeSession) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id ? { ...s, status: "Closed" } : s
        )
      );
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
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
        {/* Mobile Header Bar - Logo & Sidebar Trigger */}
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

            {/* Mobile Logo Group */}
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
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Page Header */}
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

          {/* Sessions Table */}
          <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                {/* Table Header */}
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

                {/* Table Body */}
                <tbody className="divide-y divide-border">
                  {sessions.map((session) => {
                    const percentage = Math.round(
                      (session.present / session.total) * 100
                    );

                    return (
                      <tr
                        key={session.id}
                        className="transition hover:bg-background"
                      >
                        {/* Session ID */}
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {session.id}
                        </td>

                        {/* Course */}
                        <td className="px-4 py-3 text-sm font-medium text-text-primary">
                          {session.course}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {session.type}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {session.date}
                        </td>

                        {/* Time */}
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {session.time}
                        </td>

                        {/* Present / Total */}
                        <td className="px-4 py-3 text-sm">
                          <span className="font-semibold text-text-primary">
                            {session.present}
                          </span>

                          <span className="text-text-secondary">
                            {" "}
                            / {session.total} ({percentage}%)
                          </span>
                        </td>

                        {/* Window */}
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {session.window}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                              session.status === "Open"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {session.status === "Open" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Session Modal (Creation Form or Active Session Screen) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] scrollbar-none w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl transition-all">
            {activeSession ? (
              /* Active Session Live View (Matching Design UI) */
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
                  {/* Pulse Icon Circle */}
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
              /* New Session Form */
              <div>
                {/* Modal Header */}
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Course */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Course
                    </label>

                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    >
                      <option value="">Select course</option>
                      <option value="CSC 301">CSC 301</option>
                      <option value="CSC 401">CSC 401</option>
                      <option value="CSC 501">CSC 501</option>
                    </select>
                  </div>

                  {/* Type */}
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

                  {/* Date */}
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

                  {/* Time */}
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

                  {/* Attendance Window */}
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

                  {/* Total Students */}
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

                  {/* Error */}
                  {error && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  {/* Buttons */}
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
                      className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Open Session
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