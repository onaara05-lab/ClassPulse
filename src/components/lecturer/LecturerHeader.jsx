import { useState } from "react";
import { LuBell, LuMenu, LuActivity } from "react-icons/lu";
import { X } from "lucide-react";

function LecturerHeader({
  title = "Lecturer Dashboard",
  subtitle = "Welcome back! Here's what's happening with your classes.",
  onMenuClick,
  onNewSession,
  actionButtonText = "+ New Session",
  showActionButton = true,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeSessionData, setActiveSessionData] = useState(null);

  const [formData, setFormData] = useState({
    course: "",
    sessionType: "Lecture",
    duration: "15 minutes",
  });

  // Handle opening modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
    if (onNewSession) onNewSession();
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form and set session as active
  const handleSubmit = (e) => {
    e.preventDefault();
    setActiveSessionData({ ...formData });
    setSessionActive(true);
  };

  // Close active session
  const handleCloseSession = () => {
    setSessionActive(false);
    setIsModalOpen(false);
    setActiveSessionData(null);
    setFormData({
      course: "",
      sessionType: "Lecture",
      duration: "15 minutes",
    });
  };

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-background hover:text-text-primary lg:hidden"
              aria-label="Open sidebar"
            >
              <LuMenu size={22} />
            </button>

            {/* Dynamic Page Heading */}
            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Notification Button */}
            <button
              type="button"
              className="relative rounded-full p-2 text-text-secondary transition hover:bg-background hover:text-text-primary"
              aria-label="Notifications"
            >
              <LuBell size={21} strokeWidth={1.8} />

              {/* Notification Indicator */}
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Action Button */}
            {showActionButton && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition sm:px-5 sm:py-2.5 sm:text-sm ${
                    sessionActive
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-primary hover:bg-primary-dark"
                  }`}
                >
                  {sessionActive ? "● Session Active" : actionButtonText}
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="hidden h-8 w-px bg-border sm:block" />

            {/* Lecturer Profile */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                AD
              </div>

              {/* Lecturer Information */}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-text-primary">
                  Dr. Adeyemi
                </p>

                <p className="text-xs text-text-secondary">Lecturer</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Attendance Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl sm:p-8">
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  New Attendance Session
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Open a time-limited session for students to mark attendance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-text-secondary transition hover:bg-background hover:text-text-primary"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Active Session View */}
            {sessionActive ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                {/* Pulse Icon Circle */}
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                  <LuActivity size={38} className="animate-pulse" />
                </div>

                {/* Session Title */}
                <h3 className="text-xl font-bold text-text-primary">
                  {activeSessionData?.course || "CSC 301"} Session Active
                </h3>

                {/* Subtitle Details */}
                <p className="mt-1 text-sm text-text-secondary">
                  {activeSessionData?.sessionType || "Lecture"} - Students can
                  now mark attendance
                </p>

                {/* Live Session Open Badge */}
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Session Open
                </div>

                {/* Close Session Button */}
                <button
                  type="button"
                  onClick={handleCloseSession}
                  className="mt-8 w-full rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
                >
                  Close Session
                </button>
              </div>
            ) : (
              /* Session Creation Form View */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Course Selection */}
                <div>
                  <label
                    htmlFor="course"
                    className="mb-2 block text-sm font-semibold text-text-primary"
                  >
                    Course
                  </label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>
                      Select course...
                    </option>
                    <option value="CSC 301">CSC 301</option>
                    <option value="CSC 401">CSC 401</option>
                    <option value="CSC 501">CSC 501</option>
                  </select>
                </div>

                {/* Session Type */}
                <div>
                  <label
                    htmlFor="sessionType"
                    className="mb-2 block text-sm font-semibold text-text-primary"
                  >
                    Session Type
                  </label>
                  <select
                    id="sessionType"
                    name="sessionType"
                    value={formData.sessionType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Practical">Practical / Lab</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>

                {/* Mark-in Window (Duration) */}
                <div>
                  <label
                    htmlFor="duration"
                    className="mb-2 block text-sm font-semibold text-text-primary"
                  >
                    Mark-in Window (minutes)
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="5 minutes">5 minutes</option>
                    <option value="10 minutes">10 minutes</option>
                    <option value="15 minutes">15 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="60 minutes">60 minutes</option>
                  </select>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text-primary transition hover:bg-background sm:w-auto sm:px-6"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="w-1/2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:w-auto sm:px-6"
                  >
                    Open Session
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default LecturerHeader;