import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuEye, LuEyeOff } from "react-icons/lu";
import logo from "../assets/classpulse-logo.png";
import { supabase } from "../supabaseClient";

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

function LecturerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    staffId: "",
    email: "",
    faculty: "",
    department: "",
    academicSession: "2025/2026",
    semester: "First Semester",
    coursesTaughtCount: "1",
    password: "",
    confirmPassword: "",
  });

  const [role, setRole] = useState("lecturer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const availableDepartments = formData.faculty
    ? AAUA_FACULTIES_AND_DEPARTMENTS[formData.faculty] || []
    : [];

  const handleChange = (event) => {
    const { name, value } = event.target;

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            staff_id: formData.staffId.trim(),
            faculty: formData.faculty.trim(),
            department: formData.department.trim(),
            academic_session: formData.academicSession,
            semester: formData.semester,
            courses_taught_count: formData.coursesTaughtCount,
            role: "lecturer",
          },
        },
      });

      if (authError) throw authError;

      if (authData?.session) {
        alert("Lecturer account created successfully!");
        navigate("/lecturer/dashboard");
      } else {
        alert(
          "Registration successful! Please check your email to confirm your account.",
        );
        navigate("/login");
      }

      setFormData({
        fullName: "",
        staffId: "",
        email: "",
        faculty: "",
        department: "",
        academicSession: "2025/2026",
        semester: "First Semester",
        coursesTaughtCount: "1",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-6 font-inter">
      <div className="mx-auto mb-5 max-w-md">
        <Link to="/">
          <img
            src={logo}
            alt="ClassPulse"
            className="mx-auto h-20 w-auto object-contain"
          />
        </Link>
      </div>

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
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Register As
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register"
                className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-text-secondary transition hover:border-primary"
              >
                Student
              </Link>
              <button
                type="button"
                onClick={() => setRole("lecturer")}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  role === "lecturer"
                    ? "border-primary bg-blue-50 text-primary"
                    : "border-border bg-surface text-text-secondary hover:border-primary"
                }`}
              >
                Lecturer
              </button>
            </div>
          </div>

          <div id="lecturer" className="space-y-4">
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
                placeholder="e.g. Dr. John Doe"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            <div>
              <label
                htmlFor="staffId"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Staff ID
              </label>
              <input
                id="staffId"
                name="staffId"
                type="text"
                value={formData.staffId}
                onChange={handleChange}
                placeholder="Enter your staff ID"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

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
                placeholder="Enter your official email address"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    ),
                  )}
                </select>
              </div>

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div>
              <label
                htmlFor="coursesTaughtCount"
                className="mb-1.5 block text-sm font-medium text-text-primary"
              >
                Number of Courses to be Taught
              </label>
              <select
                id="coursesTaughtCount"
                name="coursesTaughtCount"
                value={formData.coursesTaughtCount}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              >
                <option value="1">1 Course</option>
                <option value="2">2 Courses</option>
                <option value="3">3 Courses</option>
                <option value="4">4 Courses</option>
                <option value="5">5 Courses</option>
                <option value="6">6+ Courses</option>
              </select>
            </div>

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

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Lecturer Account"}
          </button>
        </form>

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

export default LecturerRegister;
