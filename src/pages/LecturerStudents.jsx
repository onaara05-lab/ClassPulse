import { useState, useEffect } from "react";
import { Search, Menu, Loader2 } from "lucide-react";
import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

const filters = ["All", "Healthy", "Warning", "At Risk"];

const normalizeAttendanceStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

function LecturerStudents() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentsData = async () => {
      try {
        setLoading(true);

        // 1. Get logged-in lecturer
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
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
              .select("id, course_code")
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
                .select("id, course_code")
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

        if (courseIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // 2. Fetch course details to build code lookup map
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("id, course_code")
          .in("id", courseIds);

        if (coursesError) throw coursesError;

        const courseMap = {};
        (coursesData || []).forEach((c) => {
          courseMap[c.id] = c.course_code || "N/A";
        });

        // 3. Fetch enrollments for these courses including student profiles
        const { data: enrollmentsData, error: enrollmentsError } =
          await supabase
            .from("enrollments")
            .select(
              `
              id,
              course_id,
              student_id,
              students:student_id (
                id,
                full_name,
                matric_number
              )
            `,
            )
            .in("course_id", courseIds);

        if (enrollmentsError) throw enrollmentsError;

        // 4. Fetch class sessions for these courses
        const { data: sessions, error: sessionsError } = await supabase
          .from("class_sessions")
          .select("id, course_id")
          .in("course_id", courseIds);

        if (sessionsError) throw sessionsError;

        const sessionToCourse = new Map(
          (sessions || []).map((session) => [session.id, session.course_id]),
        );
        const sessionIds = [...sessionToCourse.keys()];

        // 5. Fetch attendance records
        const { data: attendanceRecords, error: attendanceError } =
          sessionIds.length > 0
            ? await supabase
                .from("attendance_records")
                .select("student_id, class_session_id, status")
                .in("class_session_id", sessionIds)
            : { data: [], error: null };

        if (attendanceError) throw attendanceError;

        const sessionsByCourse = new Map();
        (sessions || []).forEach(({ course_id }) => {
          sessionsByCourse.set(
            course_id,
            (sessionsByCourse.get(course_id) || 0) + 1,
          );
        });

        const presentByStudentCourse = new Map();
        const seenAttendance = new Set();
        (attendanceRecords || []).forEach((record) => {
          const status = normalizeAttendanceStatus(record.status);
          if (status !== "present" && status !== "late") return;

          const courseId = sessionToCourse.get(record.class_session_id);
          const uniqueKey = `${record.student_id}:${courseId}:${record.class_session_id}`;
          if (seenAttendance.has(uniqueKey)) return;
          seenAttendance.add(uniqueKey);

          const key = `${record.student_id}:${courseId}`;
          presentByStudentCourse.set(
            key,
            (presentByStudentCourse.get(key) || 0) + 1,
          );
        });

        let baseStudentList = [];

        if (enrollmentsData && enrollmentsData.length > 0) {
          baseStudentList = enrollmentsData.map((e) => ({
            id: e.id,
            course_id: e.course_id,
            student_id: e.student_id,
            student: e.students,
          }));
        } else {
          // Fallback: If enrollments table is empty, collect unique students from attendance records
          const uniqueAttendeeKeys = new Set();
          (attendanceRecords || []).forEach((record) => {
            const courseId = sessionToCourse.get(record.class_session_id);
            if (record.student_id && courseId) {
              uniqueAttendeeKeys.add(`${record.student_id}:${courseId}`);
            }
          });

          const uniqueStudentIds = [
            ...new Set(
              Array.from(uniqueAttendeeKeys).map((k) => k.split(":")[0]),
            ),
          ];

          let profiles = [];
          if (uniqueStudentIds.length > 0) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, matric_number")
              .in("id", uniqueStudentIds);
            profiles = profileData || [];
          }

          const profileMap = new Map(profiles.map((p) => [p.id, p]));

          Array.from(uniqueAttendeeKeys).forEach((key) => {
            const [studentId, courseId] = key.split(":");
            baseStudentList.push({
              id: key,
              course_id: courseId,
              student_id: studentId,
              student: profileMap.get(studentId) || {
                id: studentId,
                full_name: "Unknown Student",
                matric_number: "N/A",
              },
            });
          });
        }

        // Format student items for the table
        const formattedStudents = baseStudentList.map((item) => {
          const studentName = item.student?.full_name || "Unknown Student";
          const initials = studentName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

          const totalSessions = sessionsByCourse.get(item.course_id) || 0;
          const presentCount =
            presentByStudentCourse.get(
              `${item.student_id}:${item.course_id}`,
            ) || 0;

          const attendance =
            totalSessions > 0
              ? Math.min(100, Math.round((presentCount / totalSessions) * 100))
              : presentCount > 0
                ? 100
                : 0;

          const status =
            attendance >= 80
              ? "Healthy"
              : attendance >= 60
                ? "Warning"
                : "At Risk";

          return {
            id: item.id,
            initials,
            name: studentName,
            matricNumber: item.student?.matric_number || "N/A",
            course: courseMap[item.course_id] || "N/A",
            attendance,
            status,
          };
        });

        setStudents(formattedStudents);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsData();
    const refreshId = window.setInterval(fetchStudentsData, 8000);

    return () => window.clearInterval(refreshId);
   }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === "All" || student.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div id="lecturerStudent" className="min-h-screen bg-background">
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
          {/* Page Title */}
          <h1 className="mb-6 text-xl font-bold text-text-primary sm:text-2xl">
            Students
          </h1>

          {/* Search and Filters */}
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* Search Bar */}
            <div className="relative w-full xl:max-w-xl">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />

              <input
                type="text"
                placeholder="Search name or matric..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none transition focus:border-primary"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg border px-4 py-2.5 text-xs font-medium transition ${
                    activeFilter === filter
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-primary hover:bg-background"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Students Table */}
          <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-text-secondary">
                <Loader2 size={24} className="mr-2 animate-spin" />
                <span className="text-sm">Loading student records...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[212.5rem] text-left">
                  <thead className="border-b border-border bg-background">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Student
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Matric No.
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Course
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Attendance
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const attendanceColor =
                          student.attendance >= 80
                            ? "bg-emerald-500"
                            : student.attendance >= 60
                              ? "bg-amber-500"
                              : "bg-red-500";

                        const statusStyles = {
                          Healthy: "bg-emerald-100 text-emerald-700",
                          Warning: "bg-amber-100 text-amber-700",
                          "At Risk": "bg-red-100 text-red-700",
                        };

                        return (
                          <tr
                            key={student.id}
                            className="transition hover:bg-background"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-primary">
                                  {student.initials}
                                </div>

                                <span className="text-sm font-medium text-text-primary">
                                  {student.name}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3 text-xs text-text-secondary">
                              {student.matricNumber}
                            </td>

                            <td className="px-4 py-3 text-sm text-text-primary">
                              {student.course}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className={`h-full rounded-full ${attendanceColor}`}
                                    style={{
                                      width: `${student.attendance}%`,
                                    }}
                                  />
                                </div>

                                <span className="text-xs font-semibold text-text-primary">
                                  {student.attendance}%
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${
                                  statusStyles[student.status] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {student.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-10 text-center text-sm text-text-secondary"
                        >
                          No enrolled students found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            {!loading && (
              <div className="border-t border-border px-4 py-3">
                <p className="text-xs text-text-secondary">
                  Showing {filteredStudents.length} students
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default LecturerStudents;
