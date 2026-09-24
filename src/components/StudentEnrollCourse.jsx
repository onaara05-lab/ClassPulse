import { useState } from "react";
import { supabase } from "../supabaseClient";

function StudentEnrollCourse() {
  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedCourseCode = courseCode.trim().toUpperCase();

    setMessage("");
    setErrorMessage("");

    if (!normalizedCourseCode) {
      setErrorMessage("Please enter a course code.");
      return;
    }

    if (!supabase) {
      setErrorMessage("Supabase is not configured. Check your .env file.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.rpc("enroll_in_course", {
        p_course_code: normalizedCourseCode,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setMessage(`Enrolled successfully in ${normalizedCourseCode}.`);
      setCourseCode("");
    } catch (error) {
      console.error("Enrollment error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-2 text-2xl font-bold text-text-primary">
        Enroll in a Course
      </h2>

      <p className="mb-6 text-sm text-text-secondary">
        Enter the course code provided by your lecturer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="courseCode"
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            Course Code
          </label>

          <input
            id="courseCode"
            type="text"
            value={courseCode}
            onChange={(event) => setCourseCode(event.target.value)}
            placeholder="e.g. CSC301"
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 uppercase outline-none focus:border-primary"
            required
          />
        </div>

        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {message && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Enrolling..." : "Enroll in Course"}
        </button>
      </form>
    </div>
  );
}

export default StudentEnrollCourse;