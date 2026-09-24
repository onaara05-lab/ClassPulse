import { useState } from "react";
import { Search, Menu } from "lucide-react";
import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

const students = [
  {
    id: 1,
    initials: "CE",
    name: "Chukwuemeka Eze",
    matricNumber: "230404001",
    course: "CSC 301",
    attendance: 85,
    status: "Healthy",
  },
  {
    id: 2,
    initials: "NB",
    name: "Ngozi Bello",
    matricNumber: "230404003",
    course: "CSC 301",
    attendance: 91,
    status: "Healthy",
  },
  {
    id: 3,
    initials: "TF",
    name: "Tunde Fashola",
    matricNumber: "230404017",
    course: "CSC 301",
    attendance: 65,
    status: "Warning",
  },
  {
    id: 4,
    initials: "YA",
    name: "Yusuf Aliyu",
    matricNumber: "230404022",
    course: "CSC 301",
    attendance: 54,
    status: "At Risk",
  },
  {
    id: 5,
    initials: "AG",
    name: "Amina Garba",
    matricNumber: "230404034",
    course: "CSC 401",
    attendance: 58,
    status: "At Risk",
  },
  {
    id: 6,
    initials: "AO",
    name: "Adaeze Okonkwo",
    matricNumber: "230404009",
    course: "CSC 401",
    attendance: 67,
    status: "Warning",
  },
  {
    id: 7,
    initials: "EN",
    name: "Emeka Nwosu",
    matricNumber: "230404041",
    course: "CSC 501",
    attendance: 70,
    status: "Warning",
  },
  {
    id: 8,
    initials: "FH",
    name: "Fatima Hassan",
    matricNumber: "230404012",
    course: "CSC 501",
    attendance: 93,
    status: "Healthy",
  },
];

const filters = ["All", "Healthy", "Warning", "At Risk"];

function LecturerStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === "All" || student.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div id="lecturerStudent" className="min-h-screen bg-background">
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
          {/* Page Title */}
          <h1 className="mb-6 text-xl font-bold text-text-primary sm:text-2xl">
            Students
          </h1>

          {/* Search and Filters */}
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* Search Bar */}
            <div className="relative w-full xl:max-w-xl">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />

              <input
                type="text"
                placeholder="Search name or matric..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none transition focus:border-primary"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg border px-4 py-2.5 text-xs font-medium transition ${
                    activeFilter === filter
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-primary hover:bg-background"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Students Table */}
          <section className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                {/* Table Header */}
                <thead className="border-b border-border bg-background">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Student
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Matric No.
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Course
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Attendance
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Status
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-border">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const attendanceColor =
                        student.attendance >= 80
                          ? "bg-emerald-500"
                          : student.attendance >= 60
                          ? "bg-amber-500"
                          : "bg-red-500";

                      const statusStyles = {
                        Healthy: "bg-emerald-100 text-emerald-700",
                        Warning: "bg-amber-100 text-amber-700",
                        "At Risk": "bg-red-100 text-red-700",
                      };

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-background"
                        >
                          {/* Student */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-primary">
                                {student.initials}
                              </div>

                              <span className="text-sm font-medium text-text-primary">
                                {student.name}
                              </span>
                            </div>
                          </td>

                          {/* Matric Number */}
                          <td className="px-4 py-3 text-xs text-text-secondary">
                            {student.matricNumber}
                          </td>

                          {/* Course */}
                          <td className="px-4 py-3 text-sm text-text-primary">
                            {student.course}
                          </td>

                          {/* Attendance */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className={`h-full rounded-full ${attendanceColor}`}
                                  style={{
                                    width: `${student.attendance}%`,
                                  }}
                                />
                              </div>

                              <span className="text-xs font-semibold text-text-primary">
                                {student.attendance}%
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${
                                statusStyles[student.status]
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-10 text-center text-sm text-text-secondary"
                      >
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3">
              <p className="text-xs text-text-secondary">
                Showing {filteredStudents.length} students
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default LecturerStudents;