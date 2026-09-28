import { useState, useEffect, useCallback } from "react";
import { LuClock, LuMenu, LuLoader, LuCalendar } from "react-icons/lu";
import StudentSidebar from "../components/Student/StudentSidebar";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function StudentSchedule() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentSchedule = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      if (enrollmentError) throw enrollmentError;
      const courseIds = (enrollments || []).map((enrollment) => enrollment.course_id);

      if (courseIds.length === 0) {
        setSchedule(DAYS_OF_WEEK.map((day) => ({ day, classes: [] })));
        return;
      }

      // Fetch schedules only for courses the student is enrolled in.
      const { data, error } = await supabase
        .from("schedules")
        .select(`
          id,
          day,
          start_time,
          end_time,
          venue,
          courses (
            course_code,
            course_name
          )
        `)
        .in("course_id", courseIds)
        .order("start_time", { ascending: true });

      if (error) throw error;

      // 2. Group fetched classes by day of the week
      const groupedSchedule = DAYS_OF_WEEK.map((day) => {
        const classesForDay = (data || [])
          .filter(
            (item) =>
              item.day && item.day.toLowerCase() === day.toLowerCase()
          )
          .map((item) => {
            const course = item.courses;
            return {
              id: item.id,
              course: course?.course_code || "N/A",
              courseTitle: course?.course_name || "",
              time: `${item.start_time} - ${item.end_time}`,
              location: item.venue || "TBA",
            };
          });

        return {
          day,
          classes: classesForDay,
        };
      });

      setSchedule(groupedSchedule);
    } catch (err) {
      console.error("Error fetching weekly schedule:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchStudentSchedule();
    })();
  }, [fetchStudentSchedule]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Weekly Schedule
            </h1>
          </div>

          {/* Schedule Grid / Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <LuLoader className="mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading schedule...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {schedule.map((dayGroup) => (
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
                    {dayGroup.classes.length === 0 ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                        <LuCalendar className="h-4 w-4" />
                        <span>No classes scheduled</span>
                      </div>
                    ) : (
                      dayGroup.classes.map((cls) => (
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
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentSchedule;
