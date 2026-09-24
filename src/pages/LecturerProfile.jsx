import { useState } from "react";
import { User, Menu } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

function LecturerProfile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const profileDetails = {
    name: "Dr. Akinwumi Damilare",
    staffId: "AAUA/2018/042",
    role: "Lecturer",
    email: "D.akinwumi@university.edu",
    department: "Computer Science",
    faculty: "computing",
    coursesTaught: "3 active courses",
    academicYear: "2025/2026",
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
              <User size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Profile
              </h1>

              <p className="mt-1 text-sm text-text-secondary">
                View your staff profile details and account information.
              </p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm">
            {/* User Header Info */}
            <div className="flex items-center gap-4 pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-sm">
                DA
              </div>

              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  {profileDetails.name}
                </h2>

                <p className="text-xs text-text-secondary">
                  Staff ID: {profileDetails.staffId}
                </p>

                <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600">
                  {profileDetails.role}
                </span>
              </div>
            </div>

            {/* Profile Information List */}
            <div className="divide-y divide-border border-t border-border text-sm">
              <div className="flex justify-between py-4">
                <span className="text-text-secondary">Email</span>
                <span className="font-semibold text-text-primary">
                  {profileDetails.email}
                </span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-text-secondary">Department</span>
                <span className="font-semibold text-text-primary">
                  {profileDetails.department}
                </span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-text-secondary">Faculty</span>
                <span className="font-semibold text-text-primary">
                  {profileDetails.faculty}
                </span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-text-secondary">Courses Taught</span>
                <span className="font-semibold text-text-primary">
                  {profileDetails.coursesTaught}
                </span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-text-secondary">Academic Year</span>
                <span className="font-semibold text-text-primary">
                  {profileDetails.academicYear}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LecturerProfile;