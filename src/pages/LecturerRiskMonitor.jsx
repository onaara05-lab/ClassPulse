import { useState } from "react";
import { AlertTriangle, Send, Menu } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

const riskStudentsData = [
  {
    id: 1,
    name: "Yusuf Aliyu",
    matricNo: "230404022",
    course: "CSC 301",
    attendance: 54,
  },
  {
    id: 2,
    name: "Amina Garba",
    matricNo: "230404034",
    course: "CSC 401",
    attendance: 58,
  },
  {
    id: 3,
    name: "Tunde Fashola",
    matricNo: "230404017",
    course: "CSC 301",
    attendance: 65,
  },
  {
    id: 4,
    name: "Adaeze Okonkwo",
    matricNo: "230404009",
    course: "CSC 401",
    attendance: 67,
  },
  {
    id: 5,
    name: "Emeka Nwosu",
    matricNo: "230404041",
    course: "CSC 501",
    attendance: 70,
  },
];

function LecturerRiskMonitor() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alertSent, setAlertSent] = useState({});

  // Summary counts calculated dynamically
  const atRiskCount = riskStudentsData.filter((s) => s.attendance < 60).length;
  const warningCount = riskStudentsData.filter(
    (s) => s.attendance >= 60 && s.attendance <= 75
  ).length;
  const healthyCount = 3; // Placeholder for healthy count matching your UI

  const handleSendAlert = (id, name) => {
    setAlertSent((prev) => ({ ...prev, [id]: true }));
    alert(`Alert notification sent to ${name}!`);
  };

  const getRiskStatus = (attendance) => {
    if (attendance < 60) {
      return {
        label: "At Risk",
        badgeClass: "bg-red-100 text-red-600",
        textClass: "text-red-600",
      };
    }
    return {
      label: "Warning",
      badgeClass: "bg-amber-100 text-amber-600",
      textClass: "text-amber-600",
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
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
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
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
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
              <p className="text-2xl font-bold text-red-600">{atRiskCount}</p>
              <p className="mt-1 text-xs font-semibold text-red-600">
                At Risk (below 60%)
              </p>
            </div>

            {/* Warning Card */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-center">
              <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
              <p className="mt-1 text-xs font-semibold text-amber-600">
                Warning (60 - 75%)
              </p>
            </div>

            {/* Healthy Card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {healthyCount}
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
                  {riskStudentsData.map((student) => {
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
                              handleSendAlert(student.id, student.name)
                            }
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${
                              alertSent[student.id]
                                ? "cursor-not-allowed text-text-secondary/50"
                                : "text-blue-600 hover:underline"
                            }`}
                          >
                            <Send size={14} />
                            {alertSent[student.id] ? "Alert Sent" : "Send Alert"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default LecturerRiskMonitor;