import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  BookOpen,
  AlertTriangle,
  X,
  Check,
  Loader,
  Bell,
} from "lucide-react";
import { LuMenu } from "react-icons/lu";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";

function StudentDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notification dropdown state
  const [showNotifications, setShowNotifications] = useState(false);

  // Real data state variables
  const [profile, setProfile] = useState(null);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [courseAttendance, setCourseAttendance] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [metrics, setMetrics] = useState({
    overallPercentage: 0,
    classesAttended: 0,
    totalClasses: 0,
    classesMissed: 0,
    enrolledCoursesCount: 0,
  });

  const normalizeAttendanceStatus = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  // Fetch Dashboard Data Function
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("User not found");

      // 2. Fetch User Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // 3. Fetch Student's Enrolled Courses & Attendance Data
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, courses(id, course_code, course_name)")
        .eq("student_id", user.id);

      const enrolledCourseIds = enrollments
        ? enrollments.map((e) => e.course_id)
        : [];

      // Fetch all attendance records for student
      const { data: attendanceRecords } = await supabase
        .from("attendance_records")
        .select("id, status, class_session_id")
        .eq("student_id", user.id);

      const totalAttended =
        attendanceRecords?.filter(
          (r) => normalizeAttendanceStatus(r.status) === "present",
        ).length || 0;

      // Fetch all class sessions for enrolled courses to compute metrics
      let totalCourseSessions = 0;
      let courseBreakdown = [];

      if (enrolledCourseIds.length > 0) {
        const { data: sessions } = await supabase
          .from("class_sessions")
          .select("id, course_id")
          .in("course_id", enrolledCourseIds);

        totalCourseSessions = sessions?.length || 0;

        // Calculate progress per course
        courseBreakdown = enrollments.map((e) => {
          const course = e.courses;
          const courseSessions =
            sessions?.filter((s) => s.course_id === course.id) || [];
          const sessionIds = courseSessions.map((s) => s.id);

          const attended =
            attendanceRecords?.filter(
              (r) =>
                sessionIds.includes(r.class_session_id) &&
                normalizeAttendanceStatus(r.status) === "present",
            ).length || 0;

          const total = courseSessions.length;
          const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

          let color = "bg-emerald-500";
          if (percent < 60) color = "bg-red-500";
          else if (percent < 75) color = "bg-amber-500";

          return {
            id: course.id,
            code: course.course_code,
            title: course.course_name,
            attended,
            total,
            percent,
            color,
          };
        });
      }

      setCourseAttendance(courseBreakdown);

      const overallPercent =
        totalCourseSessions > 0
          ? Math.round((totalAttended / totalCourseSessions) * 100)
          : 0;

      setMetrics({
        overallPercentage: overallPercent,
        classesAttended: totalAttended,
        totalClasses: totalCourseSessions,
        classesMissed: Math.max(0, totalCourseSessions - totalAttended),
        enrolledCoursesCount: enrolledCourseIds.length,
      });

      // 4. Fetch Today's Active/Upcoming Class Sessions
      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      let todaySessions = [];

      if (enrolledCourseIds.length > 0) {
        const { data: sessionsForToday, error: todaySessionsError } =
          await supabase
            .from("class_sessions")
            .select(
              "id, session_date, start_time, end_time, venue, attendance_open, courses(course_code, course_name)",
            )
            .in("course_id", enrolledCourseIds)
            .or(`attendance_open.eq.true,session_date.eq.${today}`);

        if (todaySessionsError) throw todaySessionsError;
        todaySessions = sessionsForToday || [];
      }

      const formattedClasses = todaySessions.map((s) => {
        const isMarked = attendanceRecords?.some(
          (r) =>
            r.class_session_id === s.id &&
            normalizeAttendanceStatus(r.status) === "present",
        );
        return {
          id: s.id,
          code: s.courses?.course_code || "N/A",
          title: s.courses?.course_name || "N/A",
          time: `${s.start_time} - ${s.end_time}`,
          venue: s.venue || "TBA",
          status: isMarked ? "Marked" : "Upcoming",
          isOpen: s.attendance_open,
        };
      });

      setTodaysClasses(formattedClasses);

      // 5. Fetch Warnings
      const { data: warningData } = await supabase
        .from("warnings")
        .select("id, message, courses(course_code)")
        .eq("student_id", user.id)
        .eq("resolved", false);

      setWarnings(warningData || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Dismiss / Clear Warning Handler
  const handleDismissWarning = async (warningId) => {
    try {
      // Update backend status to resolved
      const { error } = await supabase
        .from("warnings")
        .update({ resolved: true })
        .eq("id", warningId);

      if (error) throw error;

      // Filter out from local state instantly
      setWarnings((prev) => prev.filter((w) => w.id !== warningId));
    } catch (err) {
      console.error("Error dismissing warning:", err.message);
      alert("Could not dismiss notification.");
    }
  };

  useEffect(() => {
    (async () => {
      await fetchDashboardData();
    })();

    // Setup Realtime subscription for new warnings
    let channel;
    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("student-warnings-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "warnings",
            filter: `student_id=eq.${user.id}`,
          },
          (payload) => {
            setWarnings((prev) => [payload.new, ...prev]);
          },
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchDashboardData]);

  // Mark Attendance Handler
  const handleConfirmAttendance = async () => {
    if (!selectedSessionId) return;

    try {
      setSubmitting(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("User not authenticated.");

      const { data: existingRecord } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("class_session_id", selectedSessionId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existingRecord) {
        setTodaysClasses((prev) =>
          prev.map((item) =>
            item.id === selectedSessionId ? { ...item, status: "Marked" } : item,
          ),
        );
        setIsSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setIsSuccess(false);
          setSelectedSessionId(null);
          fetchDashboardData();
        }, 1800);
        return;
      }

      const nowIso = new Date().toISOString();

      const { error } = await supabase.from("attendance_records").insert([
        {
          student_id: user.id,
          class_session_id: selectedSessionId,
          status: "present",
          marked_at: nowIso,
        },
      ]);

      if (error) throw error;

      setTodaysClasses((prev) =>
        prev.map((item) =>
          item.id === selectedSessionId ? { ...item, status: "Marked" } : item,
        ),
      );

      setIsSuccess(true);

      setTimeout(() => {
        setShowModal(false);
        setIsSuccess(false);
        setSelectedSessionId(null);
        fetchDashboardData();
      }, 1800);
    } catch (err) {
      alert("Error marking attendance: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsSuccess(false);
    setSelectedSessionId(null);
  };

  const activeSessions = todaysClasses.filter(
    (item) => item.status === "Upcoming" && item.isOpen,
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Student Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
        {/* Top Header Bar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Open sidebar"
            >
              <LuMenu size={22} />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <img
                  src={logo}
                  alt="ClassPulse"
                  className="h-14 w-auto object-contain sm:h-16"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                ClassPulse
              </span>
            </div>
          </div>

          {/* Right Header Element: Notification Bell */}
          <div className="relative ml-auto flex items-center">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="View notifications"
            >
              <Bell size={20} />
              {warnings.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {warnings.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Modal */}
            {showNotifications && (
              <div className="absolute right-0 mt-64 w-80 max-w-sm rounded-2xl border border-border bg-white p-4 shadow-xl z-50">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      Lecturer Warnings
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {warnings.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {warnings.length > 0 ? (
                    warnings.map((warn) => (
                      <div
                        key={warn.id}
                        className="flex items-start justify-between gap-2.5 rounded-xl bg-amber-50/60 p-3 border border-amber-100"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className="mt-0.5 shrink-0 text-amber-600"
                            size={16}
                          />
                          <div>
                            <p className="text-xs font-semibold text-amber-900">
                              {warn.courses?.course_code || "Course Notice"}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800/90">
                              {warn.message}
                            </p>
                          </div>
                        </div>

                        {/* Dismiss Notification Button */}
                        <button
                          type="button"
                          onClick={() => handleDismissWarning(warn.id)}
                          className="shrink-0 rounded-lg p-1 text-amber-700 hover:bg-amber-200/60 transition"
                          title="Dismiss notification"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-xs text-text-secondary">
                      No active warnings. You're doing great!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Good day, {profile?.full_name?.split(" ")[0] || "Student"}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Mark Attendance
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Overall Attendance */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">
                  Overall Attendance
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {metrics.overallPercentage}%
                </p>
                <p className="mt-1 text-[11px] text-text-secondary">
                  Across all courses
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Classes Attended */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">
                  Classes Attended
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {metrics.classesAttended}
                </p>
                <p className="mt-1 text-[11px] text-text-secondary">
                  Out of {metrics.totalClasses} total
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle size={20} />
              </div>
            </div>

            {/* Classes Missed */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">
                  Classes Missed
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {metrics.classesMissed}
                </p>
                <p className="mt-1 text-[11px] text-text-secondary">
                  This semester
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
                <XCircle size={20} />
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">
                  Enrolled Courses
                </p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {metrics.enrolledCoursesCount}
                </p>
                <p className="mt-1 text-[11px] text-text-secondary">
                  Active this term
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
                <BookOpen size={20} />
              </div>
            </div>
          </div>

          {/* Threshold Status Banner */}
          <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  Threshold Status
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Minimum required attendance: 75%
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                  metrics.overallPercentage >= 75
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {metrics.overallPercentage >= 75 ? "Good Standing" : "Warning"}
              </span>
            </div>

            <div className="relative mt-4">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${
                    metrics.overallPercentage >= 75
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(metrics.overallPercentage, 100)}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-text-secondary">
                <span>0%</span>
                <span className="font-semibold text-amber-600">
                  75% threshold
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Attendance Trend & Today's Classes */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Attendance Trend Chart */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-text-primary">
                Attendance Trend
              </h2>
              <div className="flex h-52 w-full flex-col justify-end rounded-xl border border-border/50 bg-linear-to-t from-blue-50/50 to-transparent p-4">
                <div className="relative h-32 w-full">
                  <svg
                    className="h-full w-full overflow-visible"
                    viewBox="0 0 400 100"
                  >
                    <path
                      d="M 0 10 Q 50 10 100 35 T 200 60 T 300 40 T 400 30"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                    />
                    <circle cx="0" cy="10" r="4" className="fill-blue-600" />
                    <circle cx="50" cy="10" r="4" className="fill-blue-600" />
                    <circle cx="100" cy="35" r="4" className="fill-blue-600" />
                    <circle cx="150" cy="20" r="4" className="fill-blue-600" />
                    <circle cx="200" cy="60" r="4" className="fill-blue-600" />
                    <circle cx="250" cy="40" r="4" className="fill-blue-600" />
                    <circle cx="300" cy="50" r="4" className="fill-blue-600" />
                    <circle cx="350" cy="30" r="4" className="fill-blue-600" />
                  </svg>
                </div>
                <div className="mt-4 flex justify-between text-[10px] font-semibold text-text-secondary">
                  <span>Wk 1</span>
                  <span>Wk 2</span>
                  <span>Wk 3</span>
                  <span>Wk 4</span>
                  <span>Wk 5</span>
                  <span>Wk 6</span>
                  <span>Wk 7</span>
                  <span>Wk 8</span>
                </div>
              </div>
            </div>

            {/* Today's Classes */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-text-primary">
                  Today's Classes
                </h2>
                <span className="text-xs text-text-secondary">
                  {todaysClasses.length} sessions
                </span>
              </div>

              <div className="space-y-3">
                {todaysClasses.length > 0 ? (
                  todaysClasses.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-background/60 p-3.5 transition hover:bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                        <div>
                          <p className="text-xs font-bold text-text-primary">
                            {item.code} - {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-secondary">
                            {item.time} <span className="mx-1">|</span>{" "}
                            {item.venue}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                          item.status === "Marked"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-xs text-text-secondary">
                    No classes scheduled for today.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Course Attendance Progress Section */}
          <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">
                Course Attendance
              </h2>
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View History &gt;
              </button>
            </div>

            <div className="space-y-5">
              {courseAttendance.length > 0 ? (
                courseAttendance.map((course) => (
                  <div key={course.id}>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-text-primary">
                        {course.code}{" "}
                        <span className="ml-1 font-normal text-text-secondary">
                          {course.title}
                        </span>
                      </span>
                      <span className="text-text-secondary">
                        {course.attended}/{course.total}{" "}
                        <span
                          className={`ml-1 font-bold ${
                            course.percent < 60
                              ? "text-red-600"
                              : course.percent < 75
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {course.percent}%
                        </span>
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${course.color}`}
                        style={{ width: `${course.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-text-secondary">
                  No enrolled courses found.
                </p>
              )}
            </div>
          </div>

          {/* Attendance Warning Alert Banner */}
          {warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={18}
                />
                <div>
                  <h3 className="text-xs font-bold text-amber-900">
                    Attendance Warning
                  </h3>
                  {warnings.map((warn) => (
                    <p
                      key={warn.id}
                      className="mt-1 text-xs leading-relaxed text-amber-800/90"
                    >
                      {warn.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mark Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
            {!isSuccess ? (
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Mark Attendance
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Select an open class session for today.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-6 space-y-3">
                  {activeSessions.length > 0 ? (
                    activeSessions.map((session) => {
                      const isSelected = selectedSessionId === session.id;

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`w-full text-left rounded-xl border p-4 transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/20"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <p className="text-sm font-bold text-gray-900">
                            {session.code} - {session.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {session.time} <span className="mx-1">|</span>{" "}
                            {session.venue}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <p className="py-4 text-center text-xs text-gray-500">
                      No active sessions available to mark right now.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!selectedSessionId || submitting}
                    onClick={handleConfirmAttendance}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-semibold text-white transition flex items-center justify-center gap-2 ${
                      selectedSessionId && !submitting
                        ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                        : "cursor-not-allowed bg-blue-400/70"
                    }`}
                  >
                    {submitting && (
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Confirm
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500">
                    <Check size={28} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Attendance marked successfully!
                </h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;