import { useState } from "react";
import StudentSidebar from "../components/Student/StudentSidebar";
import { LuTriangleAlert } from "react-icons/lu";

const warningsData = [
  {
    id: 1,
    title: "Critical: PHY 301 Attendance (54%)",
    message:
      "Your attendance in PHY 301 - Electromagnetism has fallen below 60%. You are at serious risk of being barred from the final examination.",
    issuedDate: "Sep 14, 2026",
    actionStatus: "Action Required",
    bgColor: "bg-red-50/60",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    textColor: "text-red-700",
    metaColor: "text-red-600",
  },
  {
    id: 2,
    title: "Warning: MAT 201 Attendance (65%)",
    message:
      "Your attendance in MAT 201 - Linear Algebra is approaching the minimum threshold of 75%. Please improve your attendance immediately.",
    issuedDate: "Sep 13, 2026",
    actionStatus: "Monitor Required",
    bgColor: "bg-amber-50/60",
    borderColor: "border-amber-200",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    textColor: "text-amber-800",
    metaColor: "text-amber-700",
  },
];

function StudentWarnings() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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

          {/* Warnings List */}
          <div className="space-y-4">
            {warningsData.map((warning) => (
              <div
                key={warning.id}
                className={`rounded-2xl border ${warning.borderColor} ${warning.bgColor} p-6 shadow-sm`}
              >
                <div className="flex items-start gap-3.5">
                  <LuTriangleAlert
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${warning.iconColor}`}
                  />

                  <div className="space-y-1.5">
                    <h2 className={`text-base font-bold ${warning.titleColor}`}>
                      {warning.title}
                    </h2>

                    <p className={`text-sm ${warning.textColor}`}>
                      {warning.message}
                    </p>

                    <p className={`pt-1 text-xs font-medium ${warning.metaColor}`}>
                      Issued: {warning.issuedDate} | {warning.actionStatus}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentWarnings;