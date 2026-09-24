import { useState } from "react";
import { Plus, X, CalendarDays, Menu } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";

const initialSchedule = [
  {
    day: "Monday",
    classes: [
      {
        id: 1,
        course: "CSC 501",
        time: "10:00 - 11:00 AM",
        venue: "Hall A",
        students: 30,
      },
    ],
  },
  {
    day: "Tuesday",
    classes: [
      {
        id: 2,
        course: "CSC 401",
        time: "8:00 - 9:00 AM",
        venue: "Lab 1",
        students: 38,
      },
    ],
  },
  {
    day: "Wednesday",
    classes: [
      {
        id: 3,
        course: "CSC 301",
        time: "2:00 - 3:00 PM",
        venue: "Lab 2",
        students: 45,
      },
      {
        id: 4,
        course: "CSC 501",
        time: "4:00 - 5:00 PM",
        venue: "Hall A",
        students: 30,
      },
    ],
  },
  {
    day: "Thursday",
    classes: [
      {
        id: 5,
        course: "CSC 301",
        time: "8:00 - 9:00 AM",
        venue: "Lab 2",
        students: 45,
      },
      {
        id: 6,
        course: "CSC 401",
        time: "12:00 - 1:00 PM",
        venue: "Lab 1",
        students: 38,
      },
    ],
  },
  {
    day: "Friday",
    classes: [
      {
        id: 7,
        course: "CSC 501",
        time: "11:00 AM - 12:00 PM",
        venue: "Hall A",
        students: 30,
      },
    ],
  },
];

function LecturerSchedule() {
  const [weeklySchedule, setWeeklySchedule] = useState(initialSchedule);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    course: "",
    day: "",
    startTime: "",
    endTime: "",
    venue: "",
    students: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.course ||
      !formData.day ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.venue ||
      !formData.students
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    const formatTime = (time) => {
      const [hours, minutes] = time.split(":");
      const hour = Number(hours);

      const period = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;

      return `${formattedHour}:${minutes} ${period}`;
    };

    const newClass = {
      id: Date.now(),
      course: formData.course,
      time: `${formatTime(formData.startTime)} - ${formatTime(
        formData.endTime
      )}`,
      venue: formData.venue,
      students: Number(formData.students),
    };

    setWeeklySchedule((prevSchedule) =>
      prevSchedule.map((day) =>
        day.day === formData.day
          ? {
              ...day,
              classes: [...day.classes, newClass],
            }
          : day
      )
    );

    setFormData({
      course: "",
      day: "",
      startTime: "",
      endTime: "",
      venue: "",
      students: "",
    });

    setError("");
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Class Schedule
            </h1>

            <button
              type="button"
              onClick={() => {
                setError("");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Schedule Class
            </button>
          </div>

          {/* Weekly Schedule */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {weeklySchedule.map((day) => (
              <article
                key={day.day}
                className="rounded-xl border border-border bg-surface p-3.5 shadow-sm"
              >
                {/* Day Header */}
                <div className="border-b border-border pb-3">
                  <h2 className="text-sm font-semibold text-text-primary">
                    {day.day}
                  </h2>
                </div>

                {/* Classes */}
                <div className="mt-3 space-y-2">
                  {day.classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                    >
                      <h3 className="text-sm font-semibold text-blue-700">
                        {classItem.course}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-blue-600">
                        {classItem.time}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {classItem.venue} | {classItem.students} students
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] scrollbar-none w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Schedule New Class
                </h2>

                <p className="mt-1 text-sm text-text-secondary">
                  Add a class to your weekly schedule.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-text-secondary transition hover:bg-background"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Course */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Course
                </label>

                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Select course</option>
                  <option value="CSC 301">CSC 301</option>
                  <option value="CSC 401">CSC 401</option>
                  <option value="CSC 501">CSC 501</option>
                </select>
              </div>

              {/* Day */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Day
                </label>

                <select
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Select day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              {/* Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">
                    End Time
                  </label>

                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Venue
                </label>

                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g. Hall A or Lab 1"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Students */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Number of Students
                </label>

                <input
                  type="number"
                  name="students"
                  value={formData.students}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 40"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-background"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <CalendarDays size={18} />
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LecturerSchedule;