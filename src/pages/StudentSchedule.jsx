import { useState } from "react";
import { LuClock, LuMenu } from "react-icons/lu";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";

const scheduleData = [
  {
    day: "Monday",
    classes: [
      { id: 1, course: "CSC 301", time: "8:00 - 9:00 AM", location: "Lab 2" },
      { id: 2, course: "PHY 301", time: "2:00 - 3:00 PM", location: "Room 201" },
    ],
  },
  {
    day: "Tuesday",
    classes: [
      { id: 3, course: "MAT 201", time: "10:00 - 11:00 AM", location: "Room 104" },
    ],
  },
  {
    day: "Wednesday",
    classes: [
      { id: 4, course: "ENG 301", time: "9:00 - 10:00 AM", location: "Hall B" },
      { id: 5, course: "CSC 301", time: "1:00 - 2:00 PM", location: "Lab 2" },
    ],
  },
  {
    day: "Thursday",
    classes: [
      { id: 6, course: "CSC 301", time: "8:00 - 9:00 AM", location: "Lab 2" },
      { id: 7, course: "ENG 301", time: "10:00 - 11:00 AM", location: "Hall B" },
      { id: 8, course: "MAT 201", time: "2:00 - 3:00 PM", location: "Room 104" },
    ],
  },
  {
    day: "Friday",
    classes: [
      { id: 9, course: "PHY 301", time: "11:00 AM - 12:00 PM", location: "Lab 3" },
    ],
  },
];

function StudentSchedule() {
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
              Weekly Schedule
            </h1>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scheduleData.map((dayGroup) => (
              <div
                key={dayGroup.day}
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                {/* Day Title */}
                <h2 className="border-b border-border/60 pb-3 text-sm font-semibold text-text-primary">
                  {dayGroup.day}
                </h2>

                {/* Classes List */}
                <div className="mt-4 space-y-4">
                  {dayGroup.classes.map((cls) => (
                    <div key={cls.id} className="flex items-start gap-3">
                      <LuClock className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {cls.course}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {cls.time} | {cls.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentSchedule;