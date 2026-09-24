import { useState } from "react";
import StudentSidebar from "../components/student/StudentSidebar";

const studentProfile = {
  name: "Chukwuemeka Eze",
  matricNumber: "230404001",
  role: "Student",
  initials: "CE",
  email: "c.eze@university.edu",
  department: "Computer Science",
  faculty: "Computing",
  level: "300 Level",
  semester: "Second Semester 2025/2026",
};

function StudentProfile() {
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
              Profile
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

          {/* Profile Card Container */}
          <div className="max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Header / Avatar Info */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-600 text-lg sm:text-xl font-bold text-white shadow-sm">
                {studentProfile.initials}
              </div>

              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-slate-900">
                  {studentProfile.name}
                </h2>
                <p className="text-xs font-medium text-slate-400">
                  {studentProfile.matricNumber}
                </p>
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
                  {studentProfile.role}
                </span>
              </div>
            </div>

            {/* Profile Details List */}
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-medium">Email</span>
                <span className="font-semibold text-slate-800">
                  {studentProfile.email}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-medium">Department</span>
                <span className="font-semibold text-slate-800">
                  {studentProfile.department}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-medium">Faculty</span>
                <span className="font-semibold text-slate-800">
                  {studentProfile.faculty}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-medium">Level</span>
                <span className="font-semibold text-slate-800">
                  {studentProfile.level}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-medium">Semester</span>
                <span className="font-semibold text-slate-800">
                  {studentProfile.semester}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentProfile;