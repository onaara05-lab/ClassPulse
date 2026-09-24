import { useState } from "react";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import LecturerHeader from "../components/lecturer/LecturerHeader";
import StatisticsCards from "../components/lecturer/StatCard";
import AttendanceCharts from "../components/lecturer/AttendanceByCourse";
import AtRiskStudentsTable from "../components/lecturer/AtRiskStudentsTable";

function LecturerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <LecturerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <LecturerHeader
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="space-y-8 p-4 sm:p-6 lg:p-8">
          {/* Page Introduction */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Dashboard Overview
            </h2>

            <p className="mt-2 text-sm text-text-secondary">
              Monitor your courses, students, and attendance performance.
            </p>
          </div>

          {/* Statistics Cards */}
          <StatisticsCards />

          {/* Charts */}
          <AttendanceCharts />

          {/* Students At Risk */}
          <AtRiskStudentsTable />
        </main>
      </div>
    </div>
  );
}

export default LecturerDashboard;