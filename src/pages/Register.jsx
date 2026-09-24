import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";
import { LuEye, LuEyeOff } from "react-icons/lu";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    email: "",
    department: "",
    faculty: "",
    academicSession: "2025/2026",
    level: "100 Level",
    semester: "First Semester",
    password: "",
    confirmPassword: "",
  });

  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    // Check passwords
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!supabase) {
      setErrorMessage(
        "Supabase client not initialized. Check .env and restart dev server."
      );
      return;
    }

    try {
      setLoading(true);

      // Create account in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,

        // Extra information attached to the Auth user
        options: {
          data: {
            full_name: formData.fullName,
            matric_number: formData.matricNumber,
            department: formData.department,
            faculty: formData.faculty,
            academic_session: formData.academicSession,
            level: formData.level,
            semester: formData.semester,
            role: "student",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      console.log("Student registered successfully:", data.user);

      if (data.session) {
        navigate("/studentdashboard");
        return;
      }

      alert(
        "Student account created. Please check your email to verify it, then log in."
      );

      // Clear form
      setFormData({
        fullName: "",
        matricNumber: "",
        email: "",
        department: "",
        faculty: "",
        academicSession: "2025/2026",
        level: "100 Level",
        semester: "First Semester",
        password: "",
        confirmPassword: "",
      });

      setRole("student");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-6 font-inter">
      {/* Logo */}
      <div className="mx-auto mb-5 max-w-md">
        <Link to="/">
          <img
            src={logo}
            alt="ClassPulse"
            className="mx-auto h-20 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Register Card */}
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-text-primary">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Join ClassPulse and start managing attendance smarter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Register As
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Student */}
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  role === "student"
                    ? "border-primary bg-blue-50 text-primary"
                    : "border-border bg-surface text-text-secondary hover:border-primary"
                }`}
              >
                Student
              </button>

              {/* Lecturer */}
              <Link
                to="/LecturerRegister"
                className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-text-secondary transition hover:border-primary"
              >
                Lecturer
              </Link>
            </div>
          </div>

          {/* Student Register Form Fields */}
          <div id="student" className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            {/* Matric Number */}
            <div>
              <label
                htmlFor="matricNumber"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Matric Number
              </label>
              <input
                id="matricNumber"
                name="matricNumber"
                type="text"
                value={formData.matricNumber}
                onChange={handleChange}
                placeholder="Enter your matric number"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            {/* Faculty & Department Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Faculty */}
              <div>
                <label
                  htmlFor="faculty"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Faculty
                </label>
                <input
                  id="faculty"
                  name="faculty"
                  type="text"
                  value={formData.faculty}
                  onChange={handleChange}
                  placeholder="e.g. Science"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label
                  htmlFor="department"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Computer Sci"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                />
              </div>
            </div>

            {/* Academic Session */}
            <div>
              <label
                htmlFor="academicSession"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Academic Session
              </label>
              <select
                id="academicSession"
                name="academicSession"
                value={formData.academicSession}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              >
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
              </select>
            </div>

            {/* Level & Semester Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Level */}
              <div>
                <label
                  htmlFor="level"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Level
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                >
                  <option value="100 Level">100 Level</option>
                  <option value="200 Level">200 Level</option>
                  <option value="300 Level">300 Level</option>
                  <option value="400 Level">400 Level</option>
                  <option value="500 Level">500 Level</option>
                </select>
              </div>

              {/* Semester */}
              <div>
                <label
                  htmlFor="semester"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Semester
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                >
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  minLength="6"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 pr-10 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <LuEyeOff className="h-5 w-5" />
                  ) : (
                    <LuEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  minLength="6"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 pr-10 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <LuEyeOff className="h-5 w-5" />
                  ) : (
                    <LuEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-dark"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Register;