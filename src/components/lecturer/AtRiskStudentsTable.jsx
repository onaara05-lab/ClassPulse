import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Eye, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";

const normalizeAttendanceStatus = (value) =>
  String(value ?? "").trim().toLowerCase();

function AtRiskStudentsTable() {
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function resolveLecturerCourseIds(user) {
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
          ...new Set([
            ...courseIds,
            ...namedCourses.map((course) => course.id),
          ]),
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

    async function fetchAtRiskStudents() {
      try {
        setError(null);

        // 1. Get authenticated user (lecturer)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user.");

        const courseIds = await resolveLecturerCourseIds(user);

        if (!courseIds || courseIds.length === 0) {
          if (isMounted) {
            setAtRiskStudents([]);
            setLoading(false);
          }
          return;
        }

        // 2. Get courses taught by this lecturer
        const { data: courses, error: coursesErr } = await supabase
          .from("courses")
          .select("id, course_code")
          .in("id", courseIds);

        if (coursesErr) throw coursesErr;

        if (!courses || courses.length === 0) {
          if (isMounted) {
            setAtRiskStudents([]);
            setLoading(false);
          }
          return;
        }

        const resolvedCourseIds = courses.map((c) => c.id);

        // Map course IDs to codes for display
        const courseCodeMap = {};
        courses.forEach((c) => {
          courseCodeMap[c.id] = c.course_code;
        });

        // 3. Fetch enrollments along with student details
        const { data: enrollments, error: enrollmentsErr } = await supabase
          .from("enrollments")
          .select(
            `
            course_id,
            student_id,
            students:student_id (
              id,
              full_name,
              matric_number
            )
          `,
          )
          .in("course_id", resolvedCourseIds);

        if (enrollmentsErr) throw enrollmentsErr;

        if (!enrollments || enrollments.length === 0) {
          if (isMounted) {
            setAtRiskStudents([]);
            setLoading(false);
          }
          return;
        }

        // 4. Fetch total sessions held per course
        const { data: sessions, error: sessionsErr } = await supabase
          .from("class_sessions")
          .select("id, course_id")
          .in("course_id", resolvedCourseIds);

        if (sessionsErr) throw sessionsErr;

        const sessionsByCourse = {};
        const sessionToCourseMap = {};
        sessions?.forEach((s) => {
          sessionsByCourse[s.course_id] =
            (sessionsByCourse[s.course_id] || 0) + 1;
          sessionToCourseMap[s.id] = s.course_id;
        });

        const sessionIds = sessions?.map((s) => s.id) || [];

        // 5. Fetch present records for these sessions
        const { data: records, error: recordsErr } = await supabase
          .from("attendance_records")
          .select("class_session_id, student_id, status")
          .in("class_session_id", sessionIds);

        if (recordsErr) throw recordsErr;

        // Key: "studentId_courseId" -> count unique attended sessions
        const presentCountMap = {};
        const seenAttendance = new Set();
        records?.forEach((record) => {
          const status = normalizeAttendanceStatus(record.status);
          if (status !== "present" && status !== "late") return;

          const courseId = sessionToCourseMap[record.class_session_id];
          const key = `${record.student_id}_${courseId}_${record.class_session_id}`;
          if (seenAttendance.has(key)) return;
          seenAttendance.add(key);

          const studentKey = `${record.student_id}_${courseId}`;
          presentCountMap[studentKey] = (presentCountMap[studentKey] || 0) + 1;
        });

        // 6. Aggregate student attendance per course and identify at-risk students (< 75%)
        const atRiskList = [];

        enrollments.forEach((e) => {
          const student = e.students;
          if (!student) return;

          const totalSessions = sessionsByCourse[e.course_id] || 0;
          if (totalSessions === 0) return; // Skip courses without sessions

          const key = `${e.student_id}_${e.course_id}`;
          const presentSessions = presentCountMap[key] || 0;
          const sessionsMissed = Math.max(0, totalSessions - presentSessions);
          const attendancePercentage = Math.round(
            (presentSessions / totalSessions) * 100,
          );

          // Threshold check: At risk if attendance is below 75%
          if (attendancePercentage < 75) {
            atRiskList.push({
              id: `${e.student_id}_${e.course_id}`,
              studentId: e.student_id,
              name: student.full_name || "Unknown Student",
              matricNumber: student.matric_number || "N/A",
              course: courseCodeMap[e.course_id] || "Course",
              attendance: attendancePercentage,
              sessionsMissed: sessionsMissed,
            });
          }
        });

        if (isMounted) {
          setAtRiskStudents(atRiskList);
        }
      } catch (err) {
        console.error("Error fetching at-risk students:", err);
        if (isMounted) {
          setError(err.message || "Failed to load at-risk students.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAtRiskStudents();
    const refreshId = window.setInterval(fetchAtRiskStudents, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshId);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      {/* Table Header */}
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="text-lg font-semibold text-text-primary">
              Students At Risk
            </h3>
          </div>

          <p className="mt-1 text-sm text-text-secondary">
            Students with attendance below the required threshold (75%).
          </p>
        </div>

        <Link
          to="/lecturer/students"
          className="text-sm font-semibold text-primary transition hover:underline"
        >
          View All Students
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-text-secondary">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
          Analyzing student attendance...
        </div>
      ) : error ? (
        <div className="p-5 text-sm text-red-600">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      ) : atRiskStudents.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-secondary">
          🎉 No students are currently at risk! All enrolled students are
          maintaining regular attendance.
        </div>
      ) : (
        <>
          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left">
              <thead className="bg-background">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Student
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Course
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Attendance
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Sessions Missed
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {atRiskStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-background"
                  >
                    {/* Student Information */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {student.name}
                        </p>

                        <p className="mt-1 text-xs text-text-secondary">
                          {student.matricNumber}
                        </p>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {student.course}
                    </td>

                    {/* Attendance */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-red-600">
                        {student.attendance}%
                      </span>
                    </td>

                    {/* Sessions Missed */}
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {student.sessionsMissed}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        At Risk
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <Link
                        to={`/lecturer/students?id=${student.studentId}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="border-t border-border px-5 py-4">
            <p className="text-xs text-text-secondary">
              Showing {atRiskStudents.length}{" "}
              {atRiskStudents.length === 1 ? "student" : "students"} requiring
              attention.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export default AtRiskStudentsTable;
