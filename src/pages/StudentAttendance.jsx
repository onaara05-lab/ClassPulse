import { useState } from "react";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";
import { LuCircleX, LuMenu } from "react-icons/lu";
import { MdCheckCircle } from "react-icons/md";

const initialAttendanceData = [
  {
    id: 1,
    date: "Sep 15, 2026",
    course: "CSC 301",
    type: "Lecture",
    time: "8:00 AM",
    status: "Present",
  },
  {
    id: 2,
    date: "Sep 15, 2026",
    course: "MAT 201",
    type: "Lecture",
    time: "10:00 AM",
    status: "Absent",
  },
  {
    id: 3,
    date: "Sep 14, 2026",
    course: "ENG 301",
    type: "Lecture",
    time: "9:00 AM",
    status: "Present",
  },
  {
    id: 4,
    date: "Sep 14, 2026",
    course: "PHY 301",
    type: "Lab",
    time: "2:00 PM",
    status: "Absent",
  },
  {
    id: 5,
    date: "Sep 13, 2026",
    course: "CSC 301",
    type: "Lecture",
    time: "8:00 AM",
    status: "Present",
  },
  {
    id: 6,
    date: "Sep 12, 2026",
    course: "MAT 201",
    type: "Tutorial",
    time: "11:00 AM",
    status: "Present",
  },
];

function StudentAttendance() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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

        {/* Main Content View */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Attendance History
            </h1>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {initialAttendanceData.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {row.date}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-800">
                        {row.course}
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
                  ))}
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