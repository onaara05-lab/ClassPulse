import { useState } from "react";
import { FileText, AlertTriangle, BarChart3, Download, File, Menu } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

const reportCards = [
  {
    id: 1,
    title: "Full Attendance Report",
    description: "All students, all sessions for this semester",
    icon: FileText,
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    title: "At-Risk Students Report",
    description: "Students below threshold with details",
    icon: AlertTriangle,
    iconColor: "text-blue-600",
  },
  {
    id: 3,
    title: "Course Summary Report",
    description: "Per-course attendance statistics",
    icon: BarChart3,
    iconColor: "text-blue-600",
  },
];

const recentExports = [
  {
    id: 1,
    fileName: "CSC301_Attendance_Sep2026.pdf",
    size: "142 KB",
    date: "Exported Sep 15, 2026",
    type: "PDF",
  },
  {
    id: 2,
    fileName: "AtRisk_Students_Sep2026.csv",
    size: "8 KB",
    date: "Exported Sep 12, 2026",
    type: "CSV",
  },
  {
    id: 3,
    fileName: "Semester_Summary_2026.pdf",
    size: "890 KB",
    date: "Exported Sep 10, 2026",
    type: "PDF",
  },
];

function LecturerReports() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleDownload = (reportTitle, format) => {
    alert(`Generating and downloading ${reportTitle} as ${format}...`);
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

          {/* Report Types Cards */}
          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {reportCards.map((card) => {
              const IconComponent = card.icon;

              return (
                <div
                  key={card.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    {/* Icon */}
                    <div className="mb-4">
                      <IconComponent size={24} className={card.iconColor} />
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-base font-bold text-text-primary">
                      {card.title}
                    </h2>

                    <p className="mt-1 text-xs text-text-secondary">
                      {card.description}
                    </p>
                  </div>

                  {/* Export Format Buttons */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(card.title, "PDF")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface hover:border-primary/40"
                    >
                      <Download size={14} />
                      PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(card.title, "CSV")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface hover:border-primary/40"
                    >
                      <Download size={14} />
                      CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Recent Exports Section */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold text-text-primary">
              Recent Exports
            </h2>

            <div className="space-y-3">
              {recentExports.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-3 rounded-xl bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-background"
                >
                  {/* File Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-text-secondary border border-border">
                      <File size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {file.fileName}
                      </p>

                      <p className="mt-0.5 text-xs text-text-secondary">
                        {file.size} <span className="mx-1">|</span> {file.date}
                      </p>
                    </div>
                  </div>

                  {/* File Format Badge & Download */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="rounded bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-text-secondary uppercase">
                      {file.type}
                    </span>

                    <button
                      type="button"
                      onClick={() => alert(`Downloading ${file.fileName}...`)}
                      className="rounded-lg p-2 text-primary transition hover:bg-primary/10"
                      aria-label="Download export"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default LecturerReports;