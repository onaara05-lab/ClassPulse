import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import logo from "../assets/classpulse-logo.png";

function Login() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (error) {
    alert(error.message);
    return;
  }

  const role = data.user.user_metadata.role;

  if (role === "student") {
    navigate("/student/dashboard");
  } else if (role === "lecturer") {
    navigate("/lecturer/dashboard");
  } else {
    alert("Your account does not have a valid role.");
  }
};

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-inter">
      {/* Logo */}
      <div className="mx-auto mb-8 max-w-md">
        <Link to="/">
          <img
            src={logo}
            alt="ClassPulse"
            className="mx-auto h-16 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Login Card */}
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>

          <p className="mt-2 text-sm text-text-secondary">
            Login to your ClassPulse account.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="Enter your email"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text-primary"
              >
                Password
              </label>

              <a
                href="#"
                className="text-xs font-semibold text-primary hover:text-primary-dark"
              >
                Forgot password?
              </a>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>

          {/* Login As */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Login As
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Student */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  defaultChecked
                  className="peer sr-only"
                />

                <div className="rounded-lg border border-border px-4 py-3 text-center text-sm font-semibold text-text-secondary transition hover:border-primary peer-checked:border-primary peer-checked:bg-blue-50 peer-checked:text-primary">
                  Student
                </div>
              </label>

              {/* Lecturer */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="lecturer"
                  className="peer sr-only"
                />

                <div className="rounded-lg border border-border px-4 py-3 text-center text-sm font-semibold text-text-secondary transition hover:border-primary peer-checked:border-primary peer-checked:bg-blue-50 peer-checked:text-primary">
                  Lecturer
                </div>
              </label>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />

            <label htmlFor="remember" className="text-sm text-text-secondary">
              Remember me
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-dark"
          >
            Login
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary-dark"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
