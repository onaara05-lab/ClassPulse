import { useState, useEffect, useCallback } from "react";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";
import { LuCircleX, LuMenu, LuSearch, LuLoader } from "react-icons/lu";
import { MdCheckCircle } from "react-icons/md";

function StudentAttendance() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Get current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      // 2. Fetch student's attendance records with joined session & course data
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          status,
          marked_at,
          class_sessions (
            id,
            session_date,
            start_time,
            end_time,
            session_type,
            courses (
              course_code,
              course_name
            )
          )
        `)
        .eq("student_id", user.id)
        .order("marked_at", { ascending: false });

      if (error) throw error;

      // 3. Format database response for UI consumption
      const formattedLogs = (data || []).map((record) => {
        const session = record.class_sessions;
        const course = session?.courses;

        // Format Date (e.g., Sep 15, 2026)
        const sessionDate = session?.session_date
          ? new Date(session.session_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A";

        // Format Time Range or Log Time
        const timeDisplay =
          session?.start_time && session?.end_time
            ? `${session.start_time} - ${session.end_time}`
            : record.marked_at
              ? new Date(record.marked_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "N/A";

        const normalizedStatus = (record.status || "unknown").toLowerCase();

        return {
          id: record.id,
          date: sessionDate,
          courseCode: course?.course_code || "N/A",
          courseTitle: course?.course_name || "N/A",
          type: session?.session_type || "Lecture",
          time: timeDisplay,
          status:
            normalizedStatus.charAt(0).toUpperCase() +
            normalizedStatus.slice(1),
        };
      });

      setAttendanceLogs(formattedLogs);
    } catch (err) {
      console.error("Error fetching attendance history:", err);
      setError(err.message || "Could not load attendance history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchAttendanceHistory();
    })();
  }, [fetchAttendanceHistory]);

  // Client-side filtering logic based on Search and Status Filter
  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesSearch =
      log.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      log.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
        {/* Mobile Top Header Bar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Open sidebar"
            >
              <LuMenu size={22} />
            </button>

            {/* Mobile Logo & Brand */}
            <div className="flex items-center gap-2">
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
        </div>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header & Controls */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Attendance History
            </h1>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Status Select Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Could not load attendance history: {error}
            </p>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <LuLoader className="h-5 w-5 animate-spin text-blue-600" />
                          <span>Loading attendance logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                          {row.date}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {row.courseCode}
                          </span>
                          {row.courseTitle !== "N/A" && (
                            <span className="ml-2 hidden text-xs text-slate-400 md:inline">
                              ({row.courseTitle})
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                          {row.type}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                          {row.time}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <div className="flex justify-center">
                            {row.status === "Present" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <MdCheckCircle className="h-3.5 w-3.5" />
                                Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100/80 px-3 py-1 text-xs font-semibold text-red-600">
                                <LuCircleX className="h-3.5 w-3.5" />
                                Absent
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentAttendance;
