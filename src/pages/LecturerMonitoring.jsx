import { useState, useEffect } from "react";
import { Menu, Loader2 } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

const normalizeAttendanceStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

function LecturerMonitoring() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [monitoringData, setMonitoringData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchMonitoringData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch current logged-in lecturer
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found.");

        const resolveLecturerCourseIds = async () => {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) {
            console.warn(
              "Profile fallback lookup failed:",
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
            await supabase
              .from("courses")
              .select("id, course_code, course_name")
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
                .select("id, course_code, course_name")
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

          return [...new Set(courseIds)];
        };

        const courseIds = await resolveLecturerCourseIds();

        if (!courseIds || courseIds.length === 0) {
          if (isMounted) {
            setMonitoringData([]);
            setLoading(false);
          }
          return;
        }

        const { data: rawCourses, error: coursesError } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .in("id", courseIds);

        if (coursesError) throw coursesError;

        if (!rawCourses || rawCourses.length === 0) {
          if (isMounted) {
            setMonitoringData([]);
            setLoading(false);
          }
          return;
        }

        // 3. Fetch enrollments with robust fallback across table and column names
        let enrollments = [];
        const enrollmentTables = [
          "enrollments",
          "course_registrations",
          "course_students",
        ];

        for (const tableName of enrollmentTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select("*")
              .in("course_id", courseIds);

            if (!error && data && data.length > 0) {
              enrollments = data;
              break;
            }
          } catch (e) {
            console.warn(`Table ${tableName} lookup skipped:`, e.message);
          }
        }

        // Group enrolled students by course supporting various foreign key names
        const studentsByCourse = {};
        enrollments?.forEach((e) => {
          const courseId = e.course_id;
          const studentId = e.student_id || e.user_id || e.profile_id;
          if (courseId && studentId) {
            if (!studentsByCourse[courseId]) {
              studentsByCourse[courseId] = new Set();
            }
            studentsByCourse[courseId].add(studentId);
          }
        });

        // 4. Fetch class sessions held per course
        const { data: sessions, error: sessionsError } = await supabase
          .from("class_sessions")
          .select("id, course_id")
          .in("course_id", courseIds);

        if (sessionsError) throw sessionsError;

        const sessionsByCourse = {};
        const sessionToCourseMap = {};
        sessions?.forEach((s) => {
          sessionsByCourse[s.course_id] =
            (sessionsByCourse[s.course_id] || 0) + 1;
          sessionToCourseMap[s.id] = s.course_id;
        });

        const sessionIds = sessions?.map((s) => s.id) || [];

        // 5. Fetch present records across sessions
        let attendanceMap = {};
        let totalPresentByCourse = {};

        if (sessionIds.length > 0) {
          const { data: records, error: recordsError } = await supabase
            .from("attendance_records")
            .select("class_session_id, student_id, status")
            .in("class_session_id", sessionIds);

          if (recordsError) throw recordsError;

          const seenAttendance = new Set();
          records?.forEach((r) => {
            const status = normalizeAttendanceStatus(r.status);
            if (status !== "present" && status !== "late") return;

            const studentId = r.student_id;
            const courseId = sessionToCourseMap[r.class_session_id];
            if (!studentId || !courseId) return;

            const key = `${studentId}_${courseId}_${r.class_session_id}`;
            if (seenAttendance.has(key)) return;
            seenAttendance.add(key);

            const studentKey = `${studentId}_${courseId}`;
            attendanceMap[studentKey] = (attendanceMap[studentKey] || 0) + 1;
            totalPresentByCourse[courseId] =
              (totalPresentByCourse[courseId] || 0) + 1;
          });
        }

        // 6. Calculate stats for each course
        const computedData = rawCourses.map((course) => {
          const courseId = course.id;
          const enrolledStudentsSet = studentsByCourse[courseId] || new Set();
          const totalStudents = enrolledStudentsSet.size;
          const totalSessions = sessionsByCourse[courseId] || 0;

          // Course Average Attendance Calculation
          const possibleTotal = totalStudents * totalSessions;
          const actualPresentTotal = totalPresentByCourse[courseId] || 0;
          const avgAttendance =
            possibleTotal > 0
              ? Math.round((actualPresentTotal / possibleTotal) * 100)
              : 0;

          // At Risk Calculation (< 75% attendance)
          let atRiskCount = 0;
          if (totalSessions > 0) {
            enrolledStudentsSet.forEach((studentId) => {
              const key = `${studentId}_${courseId}`;
              const studentPresentCount = attendanceMap[key] || 0;
              const studentPercentage =
                (studentPresentCount / totalSessions) * 100;
              if (studentPercentage < 75) {
                atRiskCount += 1;
              }
            });
          }

          return {
            id: courseId,
            code: course.course_code,
            title: course.course_name,
            attendance: avgAttendance,
            students: totalStudents,
            sessions: totalSessions,
            atRisk: atRiskCount,
          };
        });

        if (isMounted) {
          setMonitoringData(computedData);
        }
      } catch (err) {
        console.error("Error loading monitoring data:", err);
        if (isMounted) {
          setError(err.message || "Failed to load monitoring metrics.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMonitoringData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Component */}
      <LecturerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
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
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="mb-6 flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Attendance Monitoring
              </h1>

              <p className="mt-1 text-sm text-text-secondary">
                Track course performance metrics and monitor students needing
                assistance.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              Loading monitoring metrics...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              {error}
            </div>
          ) : monitoringData.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-secondary">
              <p className="text-base font-semibold text-text-primary">
                No active courses found
              </p>
              <p className="mt-1 text-sm">
                Courses assigned to you will appear here with live attendance
                analytics.
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {monitoringData.map((course) => {
                const attendanceIsLow = course.attendance < 80;

                return (
                  <article
                    key={course.id}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-text-primary sm:text-lg">
                          {course.code}
                        </h2>

                        <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                          {course.title}
                        </p>
                      </div>

                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          attendanceIsLow
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {course.attendance}% avg
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            attendanceIsLow ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${course.attendance}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-background/60 p-3 text-center">
                        <p className="text-base font-bold text-text-primary sm:text-lg">
                          {course.students}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          Students
                        </p>
                      </div>

                      <div className="rounded-xl bg-background/60 p-3 text-center">
                        <p className="text-base font-bold text-text-primary sm:text-lg">
                          {course.sessions}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          Sessions
                        </p>
                      </div>

                      <div className="rounded-xl bg-red-50 p-3 text-center">
                        <p className="text-base font-bold text-red-600 sm:text-lg">
                          {course.atRisk}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-red-600">
                          At Risk
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default LecturerMonitoring;
