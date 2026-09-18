import logo from "../assets/classpulse-logo.png";

function Footer() {
  return (
    <footer className="border-t border-border bg-text-primary">

      <div className="mx-auto max-w-7xl px-6 py-14">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1 pr-10">
            <img
              src={logo}
              alt="ClassPulse"
              className="h-14 w-auto rounded-2xl object-contain"
            />

            <p className="mt-5 max-w-xs text-sm leading-6 text-text-secondary">
              A smarter way to manage class attendance, monitor student
              engagement, and identify attendance problems early.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Navigation
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-sm text-text-secondary transition hover:text-primary"
                >
                  Features
                </a>
              </li>

              <li>
                <a
                  href="#how-it-works"
                  className="text-sm text-text-secondary transition hover:text-primary"
                >
                  How It Works
                </a>
              </li>

              <li>
                <a
                  href="#about"
                  className="text-sm text-text-secondary transition hover:text-primary"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Product
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-text-secondary transition hover:text-primary"
                >
                  Student Dashboard
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-text-secondary transition hover:text-primary"
                >
                  Lecturer Dashboard
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-text-secondary transition hover:text-primary"
                >
                  Attendance
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-text-secondary transition hover:text-primary"
                >
                  Early-Warning
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Contact
            </h3>

            <ul className="mt-5 space-y-3">

              <li className="text-sm text-text-secondary">
                Email: classpulse@gmail.com
              </li>

              <li className="text-sm text-text-secondary">
                Phone: +234 9070977040
              </li>

              <li className="text-sm text-text-secondary">
                Nigeria
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-text-secondary">
            © 2026 ClassPulse. All rights reserved.
          </p>

          <div className="flex gap-6">

            <a
              href="#"
              className="text-sm text-text-secondary transition hover:text-primary"
            >
              Privacy Policy
            </a>

            <a
              href="#"
              className="text-sm text-text-secondary transition hover:text-primary"
            >
              Terms of Service
            </a>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;