import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { LuBell, LuMenu, LuActivity } from "react-icons/lu";
import { X, Loader2, Clock, Calendar } from "lucide-react";
import { supabase } from "../../supabaseClient";

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
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [recentMarks, setRecentMarks] = useState([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [courses, setCourses] = useState([]);

  // Notification states (Class schedule reminders, alerts, & dismissals)
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  const [userProfile, setUserProfile] = useState({
    name: "Lecturer",
    initials: "L",
  });

  const [formData, setFormData] = useState({
    course: "",
    sessionType: "Lecture",
    duration: "15",
  });
  const timerRef = useRef(null);
  const activeSessionId = activeSessionData?.id;

  const normalizeAttendanceStatus = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const resolveLecturerCourseIds = useCallback(async (user) => {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn(
        "Profile lookup failed during lecturer fallback:",
        profileError.message,
      );
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
      await supabase.from("courses").select("id").eq("lecturer_id", user.id);

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
          .select("id")
          .eq("lecturer_name", candidateName);

      if (namedCoursesError) {
        console.warn(
          "Fallback lecturer-name lookup failed:",
          namedCoursesError.message,
        );
        continue;
      }

      courseIds = [
        ...new Set([...courseIds, ...namedCourses.map((course) => course.id)]),
      ];
    }

    if (courseIds.length === 0) {
      const { data: openSessions = [], error: openSessionError } =
        await supabase
          .from("class_sessions")
          .select("course_id, courses ( lecturer_id, lecturer_name )")
          .eq("attendance_open", true);

      if (openSessionError) {
        console.warn(
          "Open-session fallback lookup failed:",
          openSessionError.message,
        );
      }

      courseIds = [
        ...new Set(
          (openSessions || [])
            .filter((session) => {
              const course = session.courses;
              if (!course) return false;

              const candidateSet = new Set(
                candidateNames.map((name) => name.toLowerCase()),
              );
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
  }, []);

  // Fetch schedule reminders & class time alerts (with expiration filtering)
  const fetchScheduleNotifications = useCallback(async (courseIds) => {
    if (!courseIds || courseIds.length === 0) {
      setNotifications([]);
      return;
    }

    try {
      setLoadingNotifications(true);
      const todayStr = getLocalDateString();
      const now = new Date();

      const { data, error } = await supabase
        .from("class_sessions")
        .select(
          `
          id,
          session_date,
          start_time,
          session_type,
          courses:course_id (course_code, course_name)
        `,
        )
        .in("course_id", courseIds)
        .gte("session_date", todayStr)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(15);

      if (error) throw error;

      // Process, categorize, and filter out expired notifications (> 60 mins past start time)
      // Process, categorize, and filter out expired notifications (> 60 mins past start time)
      const formattedAlerts = (data || [])
        .map((session) => {
          const sessionDate = session.session_date;
          const startTime = session.start_time; // format like "09:00:00"

          const sessionDateTime = new Date(`${sessionDate}T${startTime}`);
          const diffMs = sessionDateTime.getTime() - now.getTime();
          const diffMins = Math.round(diffMs / (1000 * 60));

          // If the class started more than 60 minutes ago, treat it as expired and exclude it
          if (diffMins < -60) {
            return null;
          }

          let alertType;
          let message;

          if (diffMins <= 0 && diffMins >= -60) {
            alertType = "live";
            message = `It's time for your ${session.session_type} class (${session.courses?.course_code || "Course"})!`;
          } else if (diffMins > 0 && diffMins <= 30) {
            alertType = "urgent";
            message = `Reminder: Your ${session.session_type} for ${session.courses?.course_code} starts in ${diffMins} minute(s).`;
          } else if (diffMins > 30 && diffMins <= 1440) {
            alertType = "upcoming";
            message = `Upcoming today: ${session.session_type} for ${session.courses?.course_code} at ${startTime.slice(0, 5)}.`;
          } else {
            alertType = "future";
            message = `Scheduled: ${session.session_type} for ${session.courses?.course_code} on ${sessionDate} at ${startTime.slice(0, 5)}.`;
          }

          return {
            id: session.id,
            type: alertType,
            message,
            timeLabel:
              sessionDate === todayStr
                ? `Today at ${startTime.slice(0, 5)}`
                : `${sessionDate} ${startTime.slice(0, 5)}`,
          };
        })
        .filter(Boolean); // Remove nulls (expired ones) // Remove nulls (expired ones)

      setNotifications(formattedAlerts);
    } catch (err) {
      console.error("Error fetching schedule alerts:", err.message);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Handler to dismiss/cancel a specific notification item
  const handleDismissNotification = (e, id) => {
    e.stopPropagation(); // Prevent dropdown click issues
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  // Filter out notifications that the user explicitly canceled/dismissed
  const activeNotifications = notifications.filter(
    (item) => !dismissedIds.has(item.id),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCloseSession = useCallback(
    async (sessionId) => {
      setLoading(true);
      try {
        const resolvedSessionId =
          typeof sessionId === "string" || typeof sessionId === "number"
            ? sessionId
            : activeSessionId;

        if (resolvedSessionId) {
          const { error } = await supabase
            .from("class_sessions")
            .update({
              is_active: false,
              attendance_open: false,
              ended_at: new Date().toISOString(),
            })
            .eq("id", resolvedSessionId);

          if (error) throw error;
        }
      } catch (error) {
        console.error("Error closing session:", error.message);
        alert("Failed to close session: " + error.message);
        return;
      } finally {
        setLoading(false);
      }

      setSessionActive(false);
      setIsModalOpen(false);
      setActiveSessionData(null);
      setRecentMarks([]);
      setAttendanceCount(0);
      setFormData({
        course: "",
        sessionType: "Lecture",
        duration: "15",
      });
    },
    [activeSessionId],
  );

  const scheduleAutoClose = useCallback(
    (session) => {
      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        if (!session || !session.expires_at) return;

        const expiresAt = new Date(session.expires_at).getTime();
        const now = Date.now();
        const msUntilExpire = expiresAt - now;

        if (msUntilExpire <= 0) {
          const immediateTimer = setTimeout(() => {
            handleCloseSession(session.id);
          }, 0);
          return () => clearTimeout(immediateTimer);
        }

        timerRef.current = setTimeout(() => {
          handleCloseSession(session.id);
        }, msUntilExpire + 1000);
      } catch (err) {
        console.error("Failed to schedule auto-close:", err);
      }
    },
    [handleCloseSession],
  );

  // Fetch current user, active session, and schedules on component mount
  useEffect(() => {
    let courseIdsList = [];

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

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Supabase profile error:", profileError.message);
        }

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

        courseIdsList = await resolveLecturerCourseIds(user);

        if (courseIdsList.length > 0) {
          const { data: activeSession, error: sessionError } = await supabase
            .from("class_sessions")
            .select("*, courses(course_code, course_name)")
            .in("course_id", courseIdsList)
            .eq("attendance_open", true)
            .order("created_at", { ascending: false })
            .maybeSingle();

          if (sessionError) {
            console.error(
              "Active session lookup failed:",
              sessionError.message,
            );
          } else if (activeSession) {
            setSessionActive(true);
            const courseObj = activeSession.courses;
            setActiveSessionData({
              ...activeSession,
              course:
                courseObj?.course_code ||
                courseObj?.course_name ||
                "Active Class",
            });
            scheduleAutoClose(activeSession);
          }

          fetchScheduleNotifications(courseIdsList);
        }
      } catch (error) {
        console.error("Error initializing header data:", error.message);
      }
    };

    fetchInitialData();

    // Real-time listener for class session changes (schedules/reminders)
    const scheduleChannel = supabase
      .channel("header_schedules_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_sessions" },
        () => {
          if (courseIdsList.length > 0) {
            fetchScheduleNotifications(courseIdsList);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleChannel);
    };
  }, [resolveLecturerCourseIds, scheduleAutoClose, fetchScheduleNotifications]);

  const handleOpenModal = async () => {
    try {
      setLoadingCourses(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user)
        throw authError || new Error("User not authenticated");

      const courseIds = await resolveLecturerCourseIds(user);
      const { data: lecturerCourses, error: coursesError } =
        courseIds.length > 0
          ? await supabase
              .from("courses")
              .select("id, course_code, course_name")
              .in("id", courseIds)
              .order("course_code", { ascending: true })
          : { data: [], error: null };

      if (coursesError) throw coursesError;

      setCourses(lecturerCourses || []);
      if ((lecturerCourses || []).length > 0 && !formData.course) {
        setFormData((prev) => ({ ...prev, course: lecturerCourses[0].id }));
      }
    } catch (err) {
      console.error("Error loading lecturer courses for modal:", err);
    } finally {
      setLoadingCourses(false);
    }

    setIsModalOpen(true);
    if (onNewSession) onNewSession();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!sessionActive || !activeSessionData?.id) return;

    const activeId = activeSessionData.id;

    const fetchAttendanceFeedback = async () => {
      try {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance_records")
          .select("student_id, status, marked_at, created_at")
          .eq("class_session_id", activeId)
          .order("marked_at", { ascending: false })
          .limit(10);

        if (attendanceError) throw attendanceError;

        const filteredRecords = (attendanceData || []).filter((record) => {
          const status = normalizeAttendanceStatus(record.status);
          return status === "present" || status === "late";
        });

        const studentIds = [
          ...new Set(
            (filteredRecords || [])
              .map((record) => record.student_id)
              .filter(Boolean),
          ),
        ];

        let profileMap = new Map();
        if (studentIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", studentIds);

          if (profileError) {
            console.warn(
              "Profiles lookup warning in feedback feed:",
              profileError.message,
            );
          } else if (profiles) {
            profiles.forEach((profile) => {
              profileMap.set(profile.id, profile.full_name || "Student");
            });
          }
        }

        const liveMarks = filteredRecords.slice(0, 5).map((record) => {
          const timestamp = record.marked_at || record.created_at;
          return {
            id: `${record.student_id}-${timestamp || Math.random()}`,
            student: profileMap.get(record.student_id) || "Student",
            time: timestamp
              ? new Date(timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now",
          };
        });

        setRecentMarks(liveMarks);
        setAttendanceCount(filteredRecords.length);
      } catch (error) {
        console.error("Error loading attendance feedback:", error.message);
        setRecentMarks([]);
        setAttendanceCount(0);
      }
    };

    fetchAttendanceFeedback();

    const feedbackInterval = window.setInterval(fetchAttendanceFeedback, 8000);
    const channel = supabase
      .channel(`live_attendance_${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
          filter: `class_session_id=eq.${activeId}`,
        },
        () => {
          fetchAttendanceFeedback();
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(feedbackInterval);
      supabase.removeChannel(channel);
    };
  }, [sessionActive, activeSessionData?.id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const durationMinutes = parseInt(formData.duration, 10);
      if (!formData.course) {
        throw new Error("Please select a course before opening a session.");
      }

      const expiresAt = new Date(
        Date.now() + durationMinutes * 60 * 1000,
      ).toISOString();

      const newSessionPayload = {
        course_id: formData.course,
        session_type: formData.sessionType,
        session_date: getLocalDateString(),
        start_time: new Date().toTimeString().slice(0, 8),
        end_time: new Date(Date.now() + durationMinutes * 60 * 1000)
          .toTimeString()
          .slice(0, 8),
        duration_minutes: durationMinutes,
        expires_at: expiresAt,
        attendance_open: true,
        is_active: true,
      };

      const { data, error } = await supabase
        .from("class_sessions")
        .insert([newSessionPayload])
        .select()
        .single();

      if (error) throw error;

      const selectedCourse = courses.find(
        (course) => course.id === formData.course,
      );
      setActiveSessionData({
        ...data,
        course: selectedCourse?.course_code || "Course",
        session_type: formData.sessionType,
      });
      setSessionActive(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error starting session:", error.message);
      alert("Failed to start session: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-background hover:text-text-primary lg:hidden"
              aria-label="Open sidebar"
            >
              <LuMenu size={22} />
            </button>

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

          <div className="flex items-center gap-3 sm:gap-5 relative">
            {/* Class Schedule & Reminders Notification Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative rounded-full p-2 text-text-secondary transition hover:bg-background hover:text-text-primary"
                aria-label="Class Schedule Reminders"
              >
                <LuBell size={21} strokeWidth={1.8} />
                {activeNotifications.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface border border-border shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <h3 className="font-bold text-text-primary text-sm">
                        Class Schedule & Reminders
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {activeNotifications.length}
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8 text-text-secondary">
                        <Loader2 size={20} className="animate-spin mr-2" />{" "}
                        Loading schedule...
                      </div>
                    ) : activeNotifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-text-secondary">
                        No active class schedule reminders.
                      </div>
                    ) : (
                      activeNotifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 transition hover:bg-background/50 relative group ${
                            item.type === "live"
                              ? "bg-emerald-50/60 border-l-4 border-emerald-500"
                              : item.type === "urgent"
                                ? "bg-amber-50/60 border-l-4 border-amber-500"
                                : ""
                          }`}
                        >
                          {/* Dismiss / Cancel Button */}
                          <button
                            type="button"
                            onClick={(e) =>
                              handleDismissNotification(e, item.id)
                            }
                            className="absolute top-3 right-3 text-text-secondary hover:text-text-primary rounded-md p-1 transition opacity-70 hover:opacity-100"
                            title="Dismiss notification"
                          >
                            <X size={14} />
                          </button>

                          <div className="flex items-center justify-between mb-1 pr-6">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                item.type === "live"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.type === "urgent"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-primary/10 text-primary"
                              }`}
                            >
                              {item.type === "live"
                                ? "● CLASS TIME"
                                : item.type === "urgent"
                                  ? "⚡ REMINDER"
                                  : "UPCOMING"}
                            </span>
                            <span className="text-[10px] text-text-secondary flex items-center gap-1">
                              <Clock size={11} /> {item.timeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-text-primary leading-relaxed mt-1 font-medium pr-4">
                            {item.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

            <div className="hidden h-8 w-px bg-border sm:block" />

            <Link
              to="/lecturer/profile"
              className="flex items-center gap-3 group transition rounded-xl p-1.5 hover:bg-background"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm transition group-hover:scale-105">
                {userProfile.initials}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition">
                  {userProfile.name}
                </p>
                <p className="text-xs text-text-secondary">Lecturer</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl sm:p-8">
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

            {sessionActive ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                  <LuActivity size={38} className="animate-pulse" />
                </div>

                <h3 className="text-xl font-bold text-text-primary">
                  {activeSessionData?.course || "Class"} Session Active
                </h3>

                <p className="mt-1 text-sm text-text-secondary">
                  {activeSessionData?.session_type || "Lecture"} - Students can
                  now mark attendance
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Session Open
                </div>

                <div className="mt-6 w-full rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Attendance feedback
                      </p>
                      <p className="mt-1 text-2xl font-bold text-emerald-800">
                        {attendanceCount}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-emerald-700 shadow-sm">
                      Live
                    </div>
                  </div>

                  {recentMarks.length === 0 ? (
                    <p className="mt-3 text-sm text-emerald-700">
                      Waiting for students to mark attendance...
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {recentMarks.map((mark) => (
                        <div
                          key={mark.id}
                          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm shadow-sm"
                        >
                          <span className="font-medium text-slate-700">
                            {mark.student}
                          </span>
                          <span className="text-xs text-slate-500">
                            {mark.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCloseSession(activeSessionData?.id)}
                  disabled={loading}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Close Session
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    disabled={loadingCourses}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {loadingCourses
                        ? "Loading courses..."
                        : "Select course..."}
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_code} - {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>

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
