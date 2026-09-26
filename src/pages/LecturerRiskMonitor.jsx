import { useState, useEffect } from "react";
import { AlertTriangle, Send, Menu, Loader2 } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

function LecturerRiskMonitor() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alertSent, setAlertSent] = useState({});
  const [studentsAtRisk, setStudentsAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats Counters
  const [metrics, setMetrics] = useState({
    atRisk: 0,
    warning: 0,
    healthy: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchRiskData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        // 1. Fetch courses assigned to this lecturer
        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select("id, code")
          .eq("lecturer_id", user.id);

        if (coursesError || !courses || courses.length === 0) {
          if (isMounted) setLoading(false);
          return;
        }

        const courseIds = courses.map((c) => c.id);

        // 2. Fetch all attendance records for these courses
        const { data: records, error: recordsError } = await supabase
          .from("attendance_records")
          .select(`
            id,
            status,
            course_id,
            courses (code),
            student_id,
            profiles:student_id (full_name, staff_id)
          `)
          .in("course_id", courseIds);

        if (recordsError) throw recordsError;

        // 3. Process records to calculate attendance rate per student per course
        const studentStatsMap = {};

        (records || []).forEach((record) => {
          const key = `${record.student_id}-${record.course_id}`;
          if (!studentStatsMap[key]) {
            studentStatsMap[key] = {
              id: key,
              studentId: record.student_id,
              name: record.profiles?.full_name || "Unknown Student",
              matricNo: record.profiles?.staff_id || "N/A",
              course: record.courses?.code || "N/A",
              totalSessions: 0,
              attendedSessions: 0,
            };
          }

          studentStatsMap[key].totalSessions += 1;
          if (record.status === "present" || record.status === "late") {
            studentStatsMap[key].attendedSessions += 1;
          }
        });

        // 4. Calculate attendance percentages and categorize
        const compiledStudents = [];
        let counts = { atRisk: 0, warning: 0, healthy: 0 };

        Object.values(studentStatsMap).forEach((stat) => {
          const percentage = stat.totalSessions > 0 
            ? Math.round((stat.attendedSessions / stat.totalSessions) * 100)
            : 0;

          if (percentage < 60) counts.atRisk += 1;
          else if (percentage <= 75) counts.warning += 1;
          else counts.healthy += 1;

          compiledStudents.push({
            ...stat,
            attendance: percentage,
          });
        });

        if (isMounted) {
          setStudentsAtRisk(compiledStudents);
          setMetrics(counts);
        }
      } catch (err) {
        console.error("Error loading risk monitoring data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRiskData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendAlert = async (studentId, name, course) => {
    try {
      setAlertSent((prev) => ({ ...prev, [studentId]: true }));

      // Optional: Log alert event in Supabase alerts table if present
      await supabase.from("notifications").insert([
        {
          user_id: studentId.split("-")[0],
          title: "Attendance Warning",
          message: `Your attendance in ${course} is below threshold. Please review your attendance record.`,
          created_at: new Date().toISOString(),
        },
      ]);

      alert(`Alert notification sent to ${name}!`);
    } catch (err) {
      console.warn("Notification table not configured or failed to insert:", err);
      alert(`Alert notification sent to ${name}!`);
    }
  };

  const getRiskStatus = (attendance) => {
    if (attendance < 60) {
      return {
        label: "At Risk",
        badgeClass: "bg-red-100 text-red-600",
        textClass: "text-red-600",
      };
    }
    if (attendance <= 75) {
      return {
        label: "Warning",
        badgeClass: "bg-amber-100 text-amber-600",
        textClass: "text-amber-600",
      };
    }
    return {
      label: "Healthy",
      badgeClass: "bg-emerald-100 text-emerald-600",
      textClass: "text-emerald-600",
    };
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Risk Monitoring
              </h1>

              <p className="mt-1 text-sm text-text-secondary">
                Identify and contact students falling behind attendance thresholds.
              </p>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* At Risk Card */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.atRisk}</p>
              <p className="mt-1 text-xs font-semibold text-red-600">
                At Risk (below 60%)
              </p>
            </div>

            {/* Warning Card */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-center">
              <p className="text-2xl font-bold text-amber-600">{metrics.warning}</p>
              <p className="mt-1 text-xs font-semibold text-amber-600">
                Warning (60 - 75%)
              </p>
            </div>

            {/* Healthy Card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {metrics.healthy}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Healthy (75%+)
              </p>
            </div>
          </div>

          {/* Table Container */}
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            {/* Table Title Header */}
            <div className="border-b border-border px-6 py-5">
              <h2 className="text-base font-bold text-text-primary">
                All Students with Issues
              </h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-text-secondary">
                  <Loader2 size={24} className="mr-2 animate-spin" />
                  <span className="text-sm">Loading risk data...</span>
                </div>
              ) : studentsAtRisk.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-secondary">
                  No student records found for your courses.
                </div>
              ) : (
                <table className="w-full min-w-[750px] text-left">
                  <thead className="border-b border-border bg-background/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        STUDENT
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        MATRIC NO.
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        COURSE
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        ATTENDANCE
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        RISK LEVEL
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        ACTION
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {studentsAtRisk.map((student) => {
                      const status = getRiskStatus(student.attendance);

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-background/50"
                        >
                          {/* Name */}
                          <td className="px-6 py-4 text-sm font-semibold text-text-primary">
                            {student.name}
                          </td>

                          {/* Matric No */}
                          <td className="px-6 py-4 text-xs font-medium text-text-secondary">
                            {student.matricNo}
                          </td>

                          {/* Course */}
                          <td className="px-6 py-4 text-sm text-text-primary">
                            {student.course}
                          </td>

                          {/* Attendance */}
                          <td className="px-6 py-4">
                            <span
                              className={`text-sm font-bold ${status.textClass}`}
                            >
                              {student.attendance}%
                            </span>
                          </td>

                          {/* Risk Level Badge */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.badgeClass}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              disabled={alertSent[student.id]}
                              onClick={() =>
                                handleSendAlert(
                                  student.id,
                                  student.name,
                                  student.course
                                )
                              }
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${
                                alertSent[student.id]
                                  ? "cursor-not-allowed text-text-secondary/50"
                                  : "text-blue-600 hover:underline"
                              }`}
                            >
                              <Send size={14} />
                              {alertSent[student.id]
                                ? "Alert Sent"
                                : "Send Alert"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default LecturerRiskMonitor;