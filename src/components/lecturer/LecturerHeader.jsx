import { useState, useEffect } from "react";
import { LuBell, LuMenu, LuActivity } from "react-icons/lu";
import { X, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient"; // Adjust path to your Supabase client instance

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
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "Lecturer",
    initials: "L",
  });

  const [formData, setFormData] = useState({
    course: "",
    sessionType: "Lecture",
    duration: "15",
  });

  // Fetch current user and active session on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("No active Supabase user found:", authError?.message);
      return;
    }

    // 1. Fetch profile row
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Supabase profile error:", profileError.message);
    }

    // 2. Fallback cascade for user name
    const fullName =
      profile?.full_name ||
      profile?.name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Lecturer";

    const names = fullName.trim().split(" ");
    const initials =
      names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0]?.toUpperCase() || "L";

    setUserProfile({
      name: fullName,
      initials,
    });

    // 3. Fetch active attendance session
    const { data: activeSession } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("lecturer_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (activeSession) {
      setSessionActive(true);
      setActiveSessionData(activeSession);
    }
  } catch (error) {
    console.error("Error initializing header data:", error.message);
  }
};

    fetchInitialData();
  }, []);

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

  // Submit form and create new session in Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const durationMinutes = parseInt(formData.duration, 10);
      const expiresAt = new Date(
        Date.now() + durationMinutes * 60 * 1000,
      ).toISOString();

      const newSessionPayload = {
        lecturer_id: user.id,
        course: formData.course,
        session_type: formData.sessionType,
        duration_minutes: durationMinutes,
        expires_at: expiresAt,
        is_active: true,
      };

      const { data, error } = await supabase
        .from("attendance_sessions")
        .insert([newSessionPayload])
        .select()
        .single();

      if (error) throw error;

      setActiveSessionData(data);
      setSessionActive(true);
    } catch (error) {
      console.error("Error starting session:", error.message);
      alert("Failed to start session: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Close active session in Supabase
  const handleCloseSession = async () => {
    setLoading(true);
    try {
      if (activeSessionData?.id) {
        const { error } = await supabase
          .from("attendance_sessions")
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq("id", activeSessionData.id);

        if (error) throw error;
      }

      setSessionActive(false);
      setIsModalOpen(false);
      setActiveSessionData(null);
      setFormData({
        course: "",
        sessionType: "Lecture",
        duration: "15",
      });
    } catch (error) {
      console.error("Error closing session:", error.message);
      alert("Failed to close session: " + error.message);
    } finally {
      setLoading(false);
    }
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
                {userProfile.initials}
              </div>

              {/* Lecturer Information */}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-text-primary">
                  {userProfile.name}
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
                  {activeSessionData?.session_type || "Lecture"} - Students can
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
                  disabled={loading}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
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
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
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
                    disabled={loading}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-6"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
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
