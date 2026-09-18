import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/classpulse-logo.png";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [role, setRole] = useState("student");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const registrationData = {
      fullName: formData.fullName,
      matricNumber: formData.matricNumber,
      email: formData.email,
      password: formData.password,
      role: role,
    };

    console.log("Registration submitted:", registrationData);

    alert("Registration submitted successfully!");

    // Clear ALL form fields
    setFormData({
      fullName: "",
      matricNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    // Reset role
    setRole("student");
  };

  return (
    <main className="min-h-screen bg-background px-6 py-3 font-inter">
      {/* Logo */}
      <div className="mx-auto mb-5 max-w-md">
        <Link to="/">
          <img
            src={logo}
            alt="ClassPulse"
            className="mx-auto h-25 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Register Card */}
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Join ClassPulse and start managing attendance smarter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Register As
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Student */}
              <a
                href="#student"
                onClick={() => setRole("student")}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  role === "student"
                    ? "border-primary bg-blue-50 text-primary"
                    : "border-border bg-surface text-text-secondary hover:border-primary"
                }`}
              >
                Student
              </a>

              {/* Lecturer */}
              <Link
                to="/LecturerRegister"
                className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary"
              >
                Lecturer
              </Link>
            </div>
          </div>

          {/* student register */}
          <div id="student">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-text-primary"
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
                className="w-full rounded-lg border border-border mb-3 bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            {/* Matric Number */}
            <div>
              <label
                htmlFor="matricNumber"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                Matric Number
              </label>

              <input
                id="matricNumber"
                name="matricNumber"
                type="number"
                value={formData.matricNumber}
                onChange={handleChange}
                placeholder="Enter your matric number"
                min="0"
                className="w-full rounded-lg border border-border mb-3 bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-text-primary"
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
                className="w-full rounded-lg border border-border mb-3 bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                minLength="6"
                className="w-full rounded-lg border border-border mb-3 bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-text-primary"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                minLength="6"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-dark"
          >
            Create Account
          </button>
        </form>

        {/* Login */}
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
