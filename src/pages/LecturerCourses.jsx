import { useState } from "react";
import { Plus, X, Menu } from "lucide-react";
import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

const initialCourses = [
  {
    id: 1,
    code: "CSC 301",
    title: "Data Structures and Algorithms",
    attendance: 81,
    students: 45,
    sessions: 26,
  },
  {
    id: 2,
    code: "CSC 401",
    title: "Operating Systems",
    attendance: 74,
    students: 38,
    sessions: 24,
  },
  {
    id: 3,
    code: "CSC 501",
    title: "Machine Learning Fundamentals",
    attendance: 88,
    students: 30,
    sessions: 20,
  },
];

function LecturerCourses() {
  const [courses, setCourses] = useState(initialCourses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    students: "",
    sessions: "",
  });

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();

    const newCourse = {
      id: Date.now(),
      code: formData.code,
      title: formData.title,
      attendance: 0,
      students: Number(formData.students),
      sessions: Number(formData.sessions),
    };

    setCourses((prevCourses) => [...prevCourses, newCourse]);

    // Reset form
    setFormData({
      code: "",
      title: "",
      students: "",
      sessions: "",
    });

    // Close modal
    setIsModalOpen(false);
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
        {/* Mobile Header Bar - Logo & Sidebar Trigger on Left */}
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

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Course Management
              </h1>

              <p className="mt-1 text-sm text-text-secondary">
                Manage your courses and monitor attendance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Course
            </button>
          </div>

          {/* Course Cards Grid */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const attendanceIsLow = course.attendance < 80;

              return (
                <article
                  key={course.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md"
                >
                  {/* Course Code and Attendance Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-text-primary sm:text-base">
                        {course.code}
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm">
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
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          attendanceIsLow ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${course.attendance}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                    <span>{course.students} students</span>
                    <span>{course.sessions} sessions</span>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Add New Course
                </h2>

                <p className="mt-1 text-sm text-text-secondary">
                  Enter the details of your new course.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-text-secondary transition hover:bg-background"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Course Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Course Code */}
              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Course Code
                </label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="e.g. CSC 302"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Course Title */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Course Title
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Computer Networks"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Number of Students */}
              <div>
                <label
                  htmlFor="students"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Number of Students
                </label>

                <input
                  id="students"
                  name="students"
                  type="number"
                  min="0"
                  placeholder="e.g. 40"
                  value={formData.students}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Total Sessions */}
              <div>
                <label
                  htmlFor="sessions"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Total Sessions
                </label>

                <input
                  id="sessions"
                  name="sessions"
                  type="number"
                  min="0"
                  placeholder="e.g. 20"
                  value={formData.sessions}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-background"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerCourses;