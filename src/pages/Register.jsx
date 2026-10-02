import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";
import { LuEye, LuEyeOff } from "react-icons/lu";

// AAUA Official Faculties and Departments Mapping
const AAUA_FACULTIES_AND_DEPARTMENTS = {
  Science: [
    "Computer Science",
    "Microbiology",
    "Plant Science and Biotechnology",
    "Animal and Environmental Biology",
    "Biochemistry",
    "Chemistry",
    "Industrial Chemistry",
    "Physics and Electronics",
    "Mathematics",
    "Statistics",
    "Geology",
  ],
  Computing: [
    "Cyber Security",
    "Software Engineering",
    "Information Technology",
    "Computer Science",
  ],
  "Administration and Management Sciences": [
    "Accounting",
    "Banking and Finance",
    "Business Administration",
    "Marketing",
    "Public Administration",
  ],
  "Social Sciences": [
    "Economics",
    "Political Science",
    "Sociology",
    "Geography",
    "Mass Communication",
    "Psychology",
  ],
  Education: [
    "Educational Management",
    "Guidance and Counselling",
    "Arts Education",
    "Science Education",
    "Social Science Education",
    "Human Kinetics and Health Education",
  ],
  Arts: [
    "English Studies",
    "History and International Studies",
    "Linguistics and Yoruba",
    "Philosophy and Religious Studies",
    "Theatre Arts",
  ],
  Law: ["Civil Law"],
  Agriculture: [
    "Agricultural Economics and Extension",
    "Animal Science",
    "Crop Science",
    "Soil Science",
    "Fisheries and Aquaculture",
  ],
  "Allied Health Sciences": [
    "Nursing Science",
    "Medical Laboratory Science",
    "Physiotherapy",
  ],
  "Environmental Designs": [
    "Architecture",
    "Estate Management",
    "Surveying and Geoinformatics",
    "Urban and Regional Planning",
  ],
};

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

  // Get available departments based on currently selected faculty
  const availableDepartments = formData.faculty
    ? AAUA_FACULTIES_AND_DEPARTMENTS[formData.faculty] || []
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "faculty") {
      setFormData((previousData) => ({
        ...previousData,
        faculty: value,
        department: "",
      }));
    } else {
      setFormData((previousData) => ({
        ...previousData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate Passwords
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!supabase) {
      setErrorMessage(
        "Supabase client not initialized. Check your .env file and restart the server."
      );
      return;
    }

    try {
      setLoading(true);

      // 1. Create account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error("Full Auth Error:", authError);
        setErrorMessage(authError.message);
        return;
      }

      const user = authData?.user;

      if (!user) {
        setErrorMessage("Signup failed. Please try again.");
        return;
      }

      // 2. Explicitly insert user profile data into public.profiles table
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: formData.fullName,
          matric_number: formData.matricNumber,
          email: formData.email,
          faculty: formData.faculty,
          department: formData.department,
          academic_session: formData.academicSession,
          level: formData.level,
          semester: formData.semester,
          role: "student",
        },
      ]);

      if (profileError) {
        console.error("Profile Insert Error:", profileError);
        setErrorMessage(`Database error saving profile: ${profileError.message}`);
        return;
      }

      // 3. Handle session / confirmation redirect
      if (authData.session) {
        navigate("/student/dashboard");
      } else {
        alert(
          "Registration successful! Please check your email to verify your account before logging in."
        );
        navigate("/login");
      }

      // Clear Form Fields
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
      setErrorMessage("An unexpected error occurred. Please try again.");
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
          {/* Role Selection */}
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
                to="/lecturer/register"
                className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-text-secondary transition hover:border-primary"
              >
                Lecturer
              </Link>
            </div>
          </div>

          {/* Student Form Fields */}
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
                <select
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  required
                >
                  <option value="">Select Faculty</option>
                  {Object.keys(AAUA_FACULTIES_AND_DEPARTMENTS).map(
                    (facultyName) => (
                      <option key={facultyName} value={facultyName}>
                        {facultyName}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Department */}
              <div>
                <label
                  htmlFor="department"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!formData.faculty}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                  required
                >
                  <option value="">
                    {formData.faculty
                      ? "Select Department"
                      : "Select faculty first"}
                  </option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
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
                  minLength={6}
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
                  minLength={6}
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

          {/* Error Display */}
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

        {/* Login Navigation Link */}
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