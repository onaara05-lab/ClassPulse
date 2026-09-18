import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/classpulse-logo.png";

function LecturerRegister() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: "lecturer",
    });

    alert("Lecturer registration submitted successfully.");

    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <main className="min-h-screen bg-background px-6 py-3 font-inter">
      <div className="mx-auto mb-5 max-w-md">
        <Link to="/">
          <img
            src={logo}
            alt="ClassPulse"
            className="mx-auto h-25 w-auto object-contain"
          />
        </Link>
      </div>

      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">
            Lecturer registration
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create your lecturer account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Full Name
            </label>

            <input
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full rounded-lg border border-border px-4 py-3"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Email Address
            </label>

            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full rounded-lg border border-border px-4 py-3"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Password
            </label>

            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              minLength="6"
              className="w-full rounded-lg border border-border px-4 py-3"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Confirm Password
            </label>

            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              minLength="6"
              className="w-full rounded-lg border border-border px-4 py-3"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dark"
          >
            Create Lecturer Account
          </button>
        </form>
      </div>
    </main>
  );
}

export default LecturerRegister;
