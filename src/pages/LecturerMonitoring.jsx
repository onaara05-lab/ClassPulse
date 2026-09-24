import { useState } from "react";
import { Menu } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

const monitoringData = [
  {
    id: 1,
    code: "CSC 301",
    title: "Data Structures and Algorithms",
    attendance: 81,
    students: 45,
    sessions: 26,
    atRisk: 2,
  },
  {
    id: 2,
    code: "CSC 401",
    title: "Operating Systems",
    attendance: 74,
    students: 38,
    sessions: 24,
    atRisk: 2,
  },
  {
    id: 3,
    code: "CSC 501",
    title: "Machine Learning Fundamentals",
    attendance: 88,
    students: 30,
    sessions: 20,
    atRisk: 1,
  },
];

function LecturerMonitoring() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          {/* Page Header */}
          <div className="mb-6 flex items-center gap-3">

            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Attendance Monitoring
              </h1>

              <p className="mt-1 text-sm text-text-secondary">
                Track course performance metrics and monitor students needing assistance.
              </p>
            </div>
          </div>

          {/* Monitoring Cards Grid */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {monitoringData.map((course) => {
              const attendanceIsLow = course.attendance < 80;

              return (
                <article
                  key={course.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md"
                >
                  {/* Card Header */}
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

                  {/* Attendance Progress Bar */}
                  <div className="mt-5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${
                          attendanceIsLow
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${course.attendance}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics Section */}
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {/* Students */}
                    <div className="rounded-xl bg-background/60 p-3 text-center">
                      <p className="text-base font-bold text-text-primary sm:text-lg">
                        {course.students}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        Students
                      </p>
                    </div>

                    {/* Sessions */}
                    <div className="rounded-xl bg-background/60 p-3 text-center">
                      <p className="text-base font-bold text-text-primary sm:text-lg">
                        {course.sessions}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        Sessions
                      </p>
                    </div>

                    {/* At Risk */}
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
        </main>
      </div>
    </div>
  );
}

export default LecturerMonitoring;