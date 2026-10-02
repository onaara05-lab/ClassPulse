import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Menu, Loader2, BookOpen } from "lucide-react";
import StudentSidebar from "../components/Student/StudentSidebar";
import { supabase } from "../supabaseClient";

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeLevel = (value) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  const match = raw.match(/(\d{1,3})/);
  return match ? match[1] : raw.replace(/\s*level\s*/g, "").replace(/\s+/g, "");
};

const matchesStudentContext = (course, student) => {
  if (!student) return true;

  const hasDepartment = Boolean(student.department);
  const hasLevel = Boolean(student.level);

  if (!hasDepartment && !hasLevel) return true;

  const departmentMatches =
    !hasDepartment ||
    normalizeValue(course.department) === normalizeValue(student.department);

  const levelMatches =
    !hasLevel || normalizeLevel(course.level) === normalizeLevel(student.level);

  return departmentMatches && levelMatches;
};

export default function StudentCourseRegistration() {
  const [courses, setCourses] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Please sign in to register for courses.");

      // Use maybeSingle() to handle cases where profile rows might not exist yet
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("department, level")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Profile fetch warning:", profileError.message);
      }

      const department =
        profile?.department || user.user_metadata?.department || "";
      const level = profile?.level || user.user_metadata?.level || "";
      const resolvedStudent = { department, level };
      setStudentProfile(resolvedStudent);

      // Fetch courses and enrollments concurrently
      const [coursesResult, enrollmentsResult] = await Promise.all([
        supabase
          .from("courses")
          .select("id, course_code, course_name, department, level")
          .order("course_code", { ascending: true }),
        supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", user.id),
      ]);

      if (coursesResult.error) throw coursesResult.error;
      if (enrollmentsResult.error) throw enrollmentsResult.error;

      const enrolledIds = new Set(
        (enrollmentsResult.data || []).map(
          (enrollment) => enrollment.course_id,
        ),
      );

      const allCourses = coursesResult.data || [];

      // Filter matching student context or already enrolled courses
      const filteredCourses = allCourses.filter(
        (course) =>
          enrolledIds.has(course.id) ||
          matchesStudentContext(course, resolvedStudent),
      );

      // Fallback to all courses if context filtering returns empty, so the UI is never blank
      const displayCourses =
        filteredCourses.length > 0 ? filteredCourses : allCourses;

      setCourses(
        displayCourses.map((course) => ({
          ...course,
          isEnrolled: enrolledIds.has(course.id),
        })),
      );
    } catch (fetchError) {
      console.error("Error loading courses:", fetchError);
      setError(
        fetchError.message || "Could not load courses. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchCourses();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchCourses]);

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Please sign in to register for courses.");

      // Ensure a profile record exists before enrolling
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: user.id,
          department: user.user_metadata?.department || "",
          level: user.user_metadata?.level || "",
        });
      }

      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert({ student_id: user.id, course_id: courseId });

      if (enrollmentError) {
        if (enrollmentError.code === "23505") {
          setCourses((current) =>
            current.map((course) =>
              course.id === courseId ? { ...course, isEnrolled: true } : course,
            ),
          );
          return;
        }
        throw enrollmentError;
      }

      setCourses((current) =>
        current.map((course) =>
          course.id === courseId ? { ...course, isEnrolled: true } : course,
        ),
      );
    } catch (enrollError) {
      console.error("Enrollment error:", enrollError);
      setError(enrollError.message || "Could not enroll in this course.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
        <header className="flex h-16 items-center border-b border-border bg-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg p-2 text-text-secondary hover:bg-background"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <span className="ml-3 font-bold text-text-primary">ClassPulse</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Course Registration
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Showing courses for{" "}
              {studentProfile?.department || "your department"} (
              {studentProfile?.level || "your level"}). Register for the courses
              you take.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchCourses}
                disabled={loading}
                className="shrink-0 rounded-md border border-red-200 px-3 py-1.5 font-semibold hover:bg-red-100 disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-slate-400" />
              <p className="font-semibold text-text-primary">
                No courses available
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                No courses match your department and level yet. Check back when
                your lecturers add them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm"
                >
                  <div>
                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary">
                      {course.course_code || "Course"}
                    </span>
                    <h2 className="mt-3 text-lg font-bold text-text-primary">
                      {course.course_name || "Untitled course"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEnroll(course.id)}
                    disabled={
                      course.isEnrolled || enrollingId !== course.id
                        ? course.isEnrolled || enrollingId !== null
                        : false
                    }
                    className={`mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${
                      course.isEnrolled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-primary text-white hover:opacity-90 disabled:opacity-60"
                    }`}
                  >
                    {course.isEnrolled ? (
                      <>
                        <Check size={16} /> Registered
                      </>
                    ) : enrollingId === course.id ? (
                      "Registering..."
                    ) : (
                      <>
                        <Plus size={16} /> Register
                      </>
                    )}
                  </button>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
