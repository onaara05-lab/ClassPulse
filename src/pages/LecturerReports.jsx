import { useState, useEffect } from "react";
import {
  FileText,
  AlertTriangle,
  BarChart3,
  Download,
  File,
  Menu,
  Loader2,
} from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

const reportCards = [
  {
    id: "full-attendance",
    title: "Full Attendance Report",
    description: "All students, all sessions for this semester",
    icon: FileText,
    iconColor: "text-blue-600",
  },
  {
    id: "at-risk",
    title: "At-Risk Students Report",
    description: "Students below threshold with details",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  {
    id: "course-summary",
    title: "Course Summary Report",
    description: "Per-course attendance statistics",
    icon: BarChart3,
    iconColor: "text-emerald-600",
  },
];

function LecturerReports() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [recentExports, setRecentExports] = useState([]);
  const [loadingExports, setLoadingExports] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) setLoadingExports(false);
          return;
        }

        // Fetch courses taught by lecturer
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .eq("lecturer_id", user.id);

        if (coursesData && isMounted) {
          setCourses(coursesData.map((course) => ({
            id: course.id,
            code: course.course_code,
            title: course.course_name,
          })));
        }

        // Fetch export logs
        const { data: exportsData, error: exportsError } = await supabase
          .from("report_exports")
          .select("*")
          .eq("lecturer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!exportsError && exportsData && isMounted) {
          setRecentExports(exportsData);
        }
      } catch (err) {
        console.error("Error loading report data:", err);
      } finally {
        if (isMounted) setLoadingExports(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to trigger CSV file download in browser
  const triggerCSVDownload = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to log newly generated report in Supabase
  const logExportToDatabase = async (fileName, fileType, fileSizeStr) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const newExport = {
        lecturer_id: user.id,
        file_name: fileName,
        file_size: fileSizeStr,
        file_type: fileType,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("report_exports")
        .insert([newExport])
        .select()
        .single();

      if (!error && data) {
        setRecentExports((prev) => [data, ...prev]);
      }
    } catch (err) {
      console.error("Failed to log export:", err);
    }
  };

  // Core handler to generate dynamic reports
  const handleDownload = async (reportType, format) => {
    const downloadKey = `${reportType}-${format}`;
    setDownloadingId(downloadKey);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("User not found");

      const { data: lecturerCourses, error: coursesError } = await supabase
        .from("courses")
        .select("id, course_code, course_name")
        .eq("lecturer_id", user.id);
      if (coursesError) throw coursesError;

      const selectedCourses = (lecturerCourses || []).filter(
        (course) => selectedCourse === "all" || course.id === selectedCourse,
      );
      const courseById = new Map(
        selectedCourses.map((course) => [course.id, course]),
      );
      const courseIds = selectedCourses.map((course) => course.id);

      const { data: sessions, error: sessionsError } = courseIds.length
        ? await supabase
            .from("class_sessions")
            .select("id, course_id")
            .in("course_id", courseIds)
        : { data: [], error: null };
      if (sessionsError) throw sessionsError;

      const sessionToCourse = new Map(
        (sessions || []).map((session) => [session.id, session.course_id]),
      );
      const sessionIds = [...sessionToCourse.keys()];
      let enrolledStudents = [];
      if (reportType === "at-risk" && courseIds.length > 0) {
        const { data, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("course_id, student_id")
          .in("course_id", courseIds);
        if (enrollmentsError) throw enrollmentsError;
        enrolledStudents = data || [];
      }
      const { data: rawRecords, error: recordsError } = sessionIds.length
        ? await supabase
            .from("attendance_records")
            .select("id, status, created_at, marked_at, class_session_id, student_id")
            .in("class_session_id", sessionIds)
        : { data: [], error: null };
      if (recordsError) throw recordsError;

      const studentIds = [...new Set([
        ...(rawRecords || []).map((record) => record.student_id),
        ...enrolledStudents.map((enrollment) => enrollment.student_id),
      ])];
      const { data: profiles, error: profilesError } = studentIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, staff_id, email")
            .in("id", studentIds)
        : { data: [], error: null };
      if (profilesError) throw profilesError;

      const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
      let records = (rawRecords || []).map((record) => {
        const course = courseById.get(sessionToCourse.get(record.class_session_id));
        return {
          ...record,
          created_at: record.marked_at || record.created_at,
          courses: {
            code: course?.course_code || "N/A",
            title: course?.course_name || "N/A",
          },
          profiles: profileById.get(record.student_id),
        };
      });

      if (reportType === "at-risk") {
        const sessionsByCourse = new Map();
        (sessions || []).forEach((session) => {
          sessionsByCourse.set(
            session.course_id,
            (sessionsByCourse.get(session.course_id) || 0) + 1,
          );
        });
        const presentByStudentCourse = new Map();
        (rawRecords || []).forEach((record) => {
          if (record.status !== "present" && record.status !== "late") return;
          const courseId = sessionToCourse.get(record.class_session_id);
          const key = `${record.student_id}:${courseId}`;
          presentByStudentCourse.set(key, (presentByStudentCourse.get(key) || 0) + 1);
        });

        records = enrolledStudents.flatMap((enrollment) => {
          const totalSessions = sessionsByCourse.get(enrollment.course_id) || 0;
          if (totalSessions === 0) return [];
          const attended = presentByStudentCourse.get(
            `${enrollment.student_id}:${enrollment.course_id}`,
          ) || 0;
          const percentage = Math.round((attended / totalSessions) * 100);
          if (percentage >= 75) return [];
          const course = courseById.get(enrollment.course_id);
          return [{
            status: `At Risk (${percentage}%)`,
            courses: { code: course?.course_code || "N/A" },
            profiles: profileById.get(enrollment.student_id),
          }];
        });
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `${reportType.toUpperCase()}_${dateStr}.${format.toLowerCase()}`;

      if (format === "CSV") {
        let csvRows = [];
        if (reportType === "at-risk") {
          csvRows.push([
            "Student Name",
            "Matric/ID",
            "Course Code",
            "Attendance Status",
          ]);
          (records || []).forEach((r) => {
            csvRows.push([
              r.profiles?.full_name || "N/A",
              r.profiles?.staff_id || "N/A",
              r.courses?.code || "N/A",
              r.status,
            ]);
          });
        } else {
          csvRows.push([
            "Student Name",
            "Matric/ID",
            "Course Code",
            "Date",
            "Status",
          ]);
          (records || []).forEach((r) => {
            csvRows.push([
              r.profiles?.full_name || "N/A",
              r.profiles?.staff_id || "N/A",
              r.courses?.code || "N/A",
              new Date(r.created_at).toLocaleDateString(),
              r.status,
            ]);
          });
        }

        const csvContent = csvRows.map((e) => e.join(",")).join("\n");
        triggerCSVDownload(csvContent, fileName);

        const calculatedSize = `${Math.max(1, Math.round(csvContent.length / 1024))} KB`;
        await logExportToDatabase(fileName, "CSV", calculatedSize);
      } else if (format === "PDF") {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
          <html>
            <head>
              <title>${fileName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2563eb; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>ClassPulse - ${reportType.replace("-", " ").toUpperCase()}</h1>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>ID / Matric</th>
                    <th>Course Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${(records || [])
                    .map(
                      (r) => `
                    <tr>
                      <td>${r.profiles?.full_name || "N/A"}</td>
                      <td>${r.profiles?.staff_id || "N/A"}</td>
                      <td>${r.courses?.code || "N/A"}</td>
                      <td>${r.status}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();

        await logExportToDatabase(fileName, "PDF", "125 KB");
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate report. Please check your data connection.");
    } finally {
      setDownloadingId(null);
    }
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

        {/* Main Section */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText size={23} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                  Reports
                </h1>

                <p className="mt-1 text-sm text-text-secondary">
                  Generate and download attendance reports and export logs.
                </p>
              </div>
            </div>

            {/* Course Filter Dropdown */}
            {courses.length > 0 && (
              <div className="w-full sm:w-64">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary outline-none focus:border-primary"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Report Action Cards */}
          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {reportCards.map((card) => {
              const IconComponent = card.icon;
              const isPdfLoading = downloadingId === `${card.id}-PDF`;
              const isCsvLoading = downloadingId === `${card.id}-CSV`;

              return (
                <div
                  key={card.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="mb-4">
                      <IconComponent size={24} className={card.iconColor} />
                    </div>

                    <h2 className="text-base font-bold text-text-primary">
                      {card.title}
                    </h2>

                    <p className="mt-1 text-xs text-text-secondary">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!!downloadingId}
                      onClick={() => handleDownload(card.id, "PDF")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface hover:border-primary/40 disabled:opacity-50"
                    >
                      {isPdfLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      PDF
                    </button>

                    <button
                      type="button"
                      disabled={!!downloadingId}
                      onClick={() => handleDownload(card.id, "CSV")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface hover:border-primary/40 disabled:opacity-50"
                    >
                      {isCsvLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Export Log Section */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold text-text-primary">
              Recent Exports
            </h2>

            {loadingExports ? (
              <div className="flex items-center justify-center py-8 text-text-secondary">
                <Loader2 size={24} className="animate-spin mr-2" />
                <span className="text-sm">Loading recent exports...</span>
              </div>
            ) : recentExports.length === 0 ? (
              <div className="rounded-xl bg-background/50 p-6 text-center text-xs text-text-secondary">
                No recent exports generated yet. Click PDF or CSV on any report
                above to export.
              </div>
            ) : (
              <div className="space-y-3">
                {recentExports.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col gap-3 rounded-xl bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-text-secondary border border-border">
                        <File size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {file.file_name || file.fileName}
                        </p>

                        <p className="mt-0.5 text-xs text-text-secondary">
                          {file.file_size || file.size}{" "}
                          <span className="mx-1">|</span>{" "}
                          {file.created_at
                            ? `Exported ${new Date(file.created_at).toLocaleDateString()}`
                            : file.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="rounded bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-text-secondary uppercase">
                        {file.file_type || file.type}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(
                            file.file_name?.split("_")[0]?.toLowerCase() ||
                              "attendance",
                            file.file_type || file.type,
                          )
                        }
                        className="rounded-lg p-2 text-primary transition hover:bg-primary/10"
                        aria-label="Download export"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default LecturerReports;
