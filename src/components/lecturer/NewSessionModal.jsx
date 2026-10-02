import { useState, useEffect } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";

export default function NewSessionModal({
  isOpen,
  onClose,
  onSessionCreated,
  courses: initialCourses = [],
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    courseId: "",
    sessionType: "Lecture",
    durationMinutes: "15",
  });

  // Fetch lecturer's courses and enrollment counts when modal opens
  useEffect(() => {
    let isMounted = true;

    async function fetchLecturerCoursesAndCounts() {
      if (!isOpen) return;

      try {
        setLoadingCourses(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found.");

        const { data: coursesData, error: fetchError } = await supabase
          .from("courses")
          .select("id, course_code, course_name")
          .eq("lecturer_id", user.id);

        if (fetchError) throw fetchError;

        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map((c) => c.id);

          // Fetch enrollments to calculate student counts per course
          const { data: enrollmentsData, error: enrollmentsError } =
            await supabase
              .from("enrollments")
              .select("course_id")
              .in("course_id", courseIds);

          if (enrollmentsError) throw enrollmentsError;

          // Map student counts by course_id
          const studentCounts = {};
          (enrollmentsData || []).forEach(({ course_id }) => {
            studentCounts[course_id] = (studentCounts[course_id] || 0) + 1;
          });

          if (isMounted) {
            const mappedCourses = coursesData.map((c) => ({
              id: c.id,
              code: c.course_code,
              title: c.course_name,
              studentCount: studentCounts[c.id] || 0,
            }));

            setCourses(mappedCourses);

            if (mappedCourses.length > 0) {
              setFormData((prev) => ({
                ...prev,
                courseId: mappedCourses[0].id,
              }));
            }
          }
        } else if (isMounted) {
          setCourses([]);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
        if (isMounted) {
          setError("Failed to load courses. Please try again.");
        }
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    }

    fetchLecturerCoursesAndCounts();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseId) {
      setError("Please select a course.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Calculate session window times and expiration
      const startTime = new Date();
      const durationMs = parseInt(formData.durationMinutes, 10) * 60000;
      const expiresAt = new Date(startTime.getTime() + durationMs);

      // Use the local calendar date to keep student and lecturer views aligned
      const getLocalDateString = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Format times to HH:MM:SS format for DB compatibility
      const formatTimeString = (date) => date.toTimeString().split(" ")[0];

      // Insert new session into Supabase with all required fields
      const { data, error: insertError } = await supabase
        .from("class_sessions")
        .insert([
          {
            course_id: formData.courseId,
            session_type: formData.sessionType,
            session_date: getLocalDateString(startTime),
            start_time: formatTimeString(startTime),
            end_time: formatTimeString(expiresAt),
            created_at: startTime.toISOString(),
            expires_at: expiresAt.toISOString(),
            is_active: true,
            attendance_open: true,
          },
        ])
        .select(
          `
          id,
          course_id,
          session_date,
          start_time,
          end_time,
          session_type,
          attendance_open,
          is_active,
          expires_at,
          courses (id, course_code, course_name)
        `,
        )
        .single();

      if (insertError) throw insertError;

      // Trigger callback if provided
      if (onSessionCreated) {
        onSessionCreated(data);
      }

      onClose();
    } catch (err) {
      console.error("Error creating session:", err);
      setError(err.message || "Failed to create attendance session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg sm:max-w-2xl overflow-hidden rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            New Attendance Session
          </h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Open a time-limited session for students to mark attendance.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Course
            </label>
            <div className="relative">
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
                disabled={loadingCourses || submitting}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10 disabled:bg-slate-100"
              >
                <option value="" disabled>
                  {loadingCourses ? "Loading courses..." : "Select course..."}
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title} ({course.studentCount ?? 0}{" "}
                    {course.studentCount === 1 ? "student" : "students"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Session Type
            </label>
            <div className="relative">
              <select
                name="sessionType"
                value={formData.sessionType}
                onChange={handleChange}
                disabled={submitting}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10 disabled:bg-slate-100"
              >
                <option value="Lecture">Lecture</option>
                <option value="Practical / Lab">Practical / Lab</option>
                <option value="Tutorial">Tutorial</option>
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mark-in Window (Minutes) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mark-in Window (minutes)
            </label>
            <div className="relative">
              <select
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                disabled={submitting}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10 disabled:bg-slate-100"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-1/2 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-center disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingCourses}
              className="w-1/2 py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-sm transition-colors text-center flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Open Session"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
