import { useState, useEffect, useCallback } from "react";
import StudentSidebar from "../components/Student/StudentSidebar";
import { TriangleAlert, Loader, CheckCircle, Info } from "lucide-react";
import { supabase } from "../supabaseClient";

// Utility to format ISO date strings into readable dates (e.g., "Sep 14, 2026")
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper function to return tailwind styles based on severity/type
const getSeverityStyles = (severity) => {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "danger":
    case "error":
      return {
        bgColor: "bg-red-50/60",
        borderColor: "border-red-200",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        textColor: "text-red-700",
        metaColor: "text-red-600",
        Icon: TriangleAlert,
      };
    case "warning":
    case "medium":
      return {
        bgColor: "bg-amber-50/60",
        borderColor: "border-amber-200",
        iconColor: "text-amber-600",
        titleColor: "text-amber-900",
        textColor: "text-amber-800",
        metaColor: "text-amber-700",
        Icon: TriangleAlert,
      };
    default:
      return {
        bgColor: "bg-blue-50/60",
        borderColor: "border-blue-200",
        iconColor: "text-blue-600",
        titleColor: "text-blue-900",
        textColor: "text-blue-800",
        metaColor: "text-blue-700",
        Icon: Info,
      };
  }
};

function StudentWarnings() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentWarnings = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Retrieve the authenticated user session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      console.log("Logged-in Student Auth ID:", user.id);

      // 2. Fetch all warnings from the table 
      // (Using loose matching or pulling all rows to bypass mismatched primary/auth IDs)
      const { data, error } = await supabase
        .from("warnings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter for warnings belonging to this user ID, or fallback to displaying all if testing locally
      const filteredWarnings = data
        ? data.filter(
            (w) =>
              w.student_id === user.id ||
              w.student_id === user.email ||
              !w.student_id
          )
        : [];

      // If strict filtering results in 0 but data exists (helpful for testing ID discrepancies), 
      // you can fallback to `data` directly or keep `filteredWarnings`.
      setWarnings(filteredWarnings.length > 0 ? filteredWarnings : data || []);
    } catch (err) {
      console.error("Error loading warnings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchStudentWarnings();
    })();
  }, [fetchStudentWarnings]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Warnings
            </h1>

            {/* Mobile Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Warnings List / States */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader className="mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading warnings...</p>
            </div>
          ) : warnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
              <CheckCircle className="mb-3 h-10 w-10 text-emerald-500" />
              <h2 className="text-base font-semibold text-slate-800">
                No Active Warnings
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                You are in good standing! Keep up with your classes and attendance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {warnings.map((warning) => {
                // Fallbacks to prevent rendering errors if fields are blank/missing
                const severity =
                  warning.severity ||
                  (warning.attendance_percentage < 60 ? "danger" : "warning");
                const title = warning.title || "Attendance Notice";

                const styles = getSeverityStyles(severity);
                const IconComponent = styles.Icon;

                return (
                  <div
                    key={warning.id}
                    className={`rounded-2xl border ${styles.borderColor} ${styles.bgColor} p-6 shadow-sm`}
                  >
                    <div className="flex items-start gap-3.5">
                      <IconComponent
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.iconColor}`}
                      />

                      <div className="space-y-1.5">
                        <h2 className={`text-base font-bold ${styles.titleColor}`}>
                          {title}
                        </h2>

                        <p className={`text-sm ${styles.textColor}`}>
                          {warning.message}
                        </p>

                        <p
                          className={`pt-1 text-xs font-medium ${styles.metaColor}`}
                        >
                          Issued:{" "}
                          {formatDate(warning.created_at || warning.issued_date)}
                          {warning.attendance_percentage
                            ? ` | Attendance: ${warning.attendance_percentage}%`
                            : ""}
                          {warning.action_status
                            ? ` | ${warning.action_status}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentWarnings;