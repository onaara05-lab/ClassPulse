import { useState } from "react";
import { TrendingUp, CheckCircle2, XCircle, BookOpen, AlertTriangle, X, Check } from "lucide-react";
import { LuMenu } from "react-icons/lu";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";

const initialClasses = [
  {
    id: 1,
    code: "CSC 301",
    title: "Data Structures",
    time: "8:00 AM",
    venue: "Lab 2",
    status: "Upcoming",
  },
  {
    id: 2,
    code: "ENG 301",
    title: "Technical Writing",
    time: "10:00 AM",
    venue: "Hall B",
    status: "Marked",
  },
  {
    id: 3,
    code: "MAT 201",
    title: "Linear Algebra",
    time: "2:00 PM",
    venue: "Room 104",
    status: "Upcoming",
  },
];

const courseAttendance = [
  { id: 1, code: "CSC 301", title: "Data Structures", attended: 22, total: 26, percent: 85, color: "bg-emerald-500" },
  { id: 2, code: "MAT 201", title: "Linear Algebra", attended: 17, total: 26, percent: 65, color: "bg-amber-500" },
  { id: 3, code: "ENG 301", title: "Technical Writing", attended: 24, total: 26, percent: 92, color: "bg-emerald-500" },
  { id: 4, code: "PHY 301", title: "Electromagnetism", attended: 14, total: 26, percent: 54, color: "bg-red-500" },
];

function StudentDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [classesList, setClassesList] = useState(initialClasses);

  // Active sessions available to be marked
  const activeSessions = classesList.filter((item) => item.status === "Upcoming");

  const handleConfirmAttendance = () => {
    if (!selectedSessionId) return;

    // Update status in real-time
    setClassesList((prevClasses) =>
      prevClasses.map((item) =>
        item.id === selectedSessionId ? { ...item, status: "Marked" } : item
      )
    );

    // Show success view inside modal
    setIsSuccess(true);

    // Automatically close modal after 1.8 seconds
    setTimeout(() => {
      setShowModal(false);
      setIsSuccess(false);
      setSelectedSessionId(null);
    }, 1800);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsSuccess(false);
    setSelectedSessionId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Student Sidebar */}
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Good morning, Chukwuemeka
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Thursday, 17 September 2026
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Mark Attendance
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Overall Attendance */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">Overall Attendance</p>
                <p className="mt-2 text-2xl font-bold text-text-primary">74%</p>
                <p className="mt-1 text-[11px] text-text-secondary">Across all courses</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Classes Attended */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">Classes Attended</p>
                <p className="mt-2 text-2xl font-bold text-text-primary">77</p>
                <p className="mt-1 text-[11px] text-text-secondary">Out of 104 total</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 size={20} />
              </div>
            </div>

            {/* Classes Missed */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">Classes Missed</p>
                <p className="mt-2 text-2xl font-bold text-text-primary">27</p>
                <p className="mt-1 text-[11px] text-text-secondary">This semester</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
                <XCircle size={20} />
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div>
                <p className="text-xs font-medium text-text-secondary">Enrolled Courses</p>
                <p className="mt-2 text-2xl font-bold text-text-primary">4</p>
                <p className="mt-1 text-[11px] text-text-secondary">Active this term</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
                <BookOpen size={20} />
              </div>
            </div>
          </div>

          {/* Threshold Status Banner */}
          <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Threshold Status</h2>
                <p className="mt-0.5 text-xs text-text-secondary">Minimum required attendance: 75%</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-700">
                Warning
              </span>
            </div>

            <div className="relative mt-4">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-amber-500" style={{ width: "74%" }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-text-secondary">
                <span>0%</span>
                <span className="font-semibold text-amber-600">75% threshold</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Attendance Trend & Today's Classes */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Attendance Trend Chart */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-text-primary">Attendance Trend</h2>
              <div className="flex h-52 w-full flex-col justify-end rounded-xl border border-border/50 bg-gradient-to-t from-blue-50/50 to-transparent p-4">
                <div className="relative h-32 w-full">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 400 100">
                    <path
                      d="M 0 10 Q 50 10 100 35 T 200 60 T 300 40 T 400 30"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                    />
                    <circle cx="0" cy="10" r="4" className="fill-blue-600" />
                    <circle cx="50" cy="10" r="4" className="fill-blue-600" />
                    <circle cx="100" cy="35" r="4" className="fill-blue-600" />
                    <circle cx="150" cy="20" r="4" className="fill-blue-600" />
                    <circle cx="200" cy="60" r="4" className="fill-blue-600" />
                    <circle cx="250" cy="40" r="4" className="fill-blue-600" />
                    <circle cx="300" cy="50" r="4" className="fill-blue-600" />
                    <circle cx="350" cy="30" r="4" className="fill-blue-600" />
                  </svg>
                </div>
                <div className="mt-4 flex justify-between text-[10px] font-semibold text-text-secondary">
                  <span>Wk 1</span>
                  <span>Wk 2</span>
                  <span>Wk 3</span>
                  <span>Wk 4</span>
                  <span>Wk 5</span>
                  <span>Wk 6</span>
                  <span>Wk 7</span>
                  <span>Wk 8</span>
                </div>
              </div>
            </div>

            {/* Today's Classes */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-text-primary">Today's Classes</h2>
                <span className="text-xs text-text-secondary">{classesList.length} sessions</span>
              </div>

              <div className="space-y-3">
                {classesList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-background/60 p-3.5 transition hover:bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          {item.code} - {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-text-secondary">
                          {item.time} <span className="mx-1">|</span> {item.venue}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        item.status === "Marked"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Course Attendance Progress Section */}
          <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">Course Attendance</h2>
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View History &gt;
              </button>
            </div>

            <div className="space-y-5">
              {courseAttendance.map((course) => (
                <div key={course.id}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-primary">
                      {course.code} <span className="ml-1 font-normal text-text-secondary">{course.title}</span>
                    </span>
                    <span className="text-text-secondary">
                      {course.attended}/{course.total}{" "}
                      <span className={`ml-1 font-bold ${
                        course.percent < 60 ? "text-red-600" : course.percent < 75 ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {course.percent}%
                      </span>
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${course.color}`}
                      style={{ width: `${course.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Warning Alert Banner */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
              <div>
                <h3 className="text-xs font-bold text-amber-900">Attendance Warning</h3>
                <p className="mt-1 text-xs leading-relaxed text-amber-800/90">
                  Your attendance in MAT 201 (65%) and PHY 301 (54%) is below or approaching the required threshold. Please attend upcoming classes to avoid academic penalties.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mark Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
            {!isSuccess ? (
              /* Step 1: Select Session Form */
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Mark Attendance
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Select the active session for today.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-6 space-y-3">
                  {activeSessions.length > 0 ? (
                    activeSessions.map((session) => {
                      const isSelected = selectedSessionId === session.id;

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`w-full text-left rounded-xl border p-4 transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/20"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <p className="text-sm font-bold text-gray-900">
                            {session.code} - {session.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {session.time} <span className="mx-1">|</span> {session.venue}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <p className="py-4 text-center text-xs text-gray-500">
                      No active sessions left to mark for today.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!selectedSessionId}
                    onClick={handleConfirmAttendance}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-semibold text-white transition ${
                      selectedSessionId
                        ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                        : "cursor-not-allowed bg-blue-400/70"
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Success Confirmation View */
              <div className="py-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500">
                    <Check size={28} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Attendance marked successfully!
                </h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;