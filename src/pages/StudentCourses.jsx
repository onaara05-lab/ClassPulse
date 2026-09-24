import { useState } from "react";
import { LuMenu } from "react-icons/lu";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";

const coursesData = [
  {
    id: 1,
    code: "CSC 301",
    title: "Data Structures",
    percent: 85,
    attended: 22,
    missed: 4,
    total: 26,
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    barColor: "bg-emerald-500",
  },
  {
    id: 2,
    code: "MAT 201",
    title: "Linear Algebra",
    percent: 65,
    attended: 17,
    missed: 9,
    total: 26,
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    barColor: "bg-amber-500",
  },
  {
    id: 3,
    code: "ENG 301",
    title: "Technical Writing",
    percent: 92,
    attended: 24,
    missed: 2,
    total: 26,
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    barColor: "bg-emerald-500",
  },
  {
    id: 4,
    code: "PHY 301",
    title: "Electromagnetism",
    percent: 54,
    attended: 14,
    missed: 12,
    total: 26,
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    barColor: "bg-red-500",
  },
];

function StudentCourses() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
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

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              My Courses
            </h1>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {coursesData.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {course.code}
                    </h2>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {course.title}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${course.badgeBg} ${course.badgeText}`}
                  >
                    {course.percent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${course.barColor}`}
                      style={{ width: `${course.percent}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
                  <span>{course.attended} attended</span>
                  <span>{course.missed} missed</span>
                  <span>{course.total} total</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentCourses;