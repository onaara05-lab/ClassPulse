import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/classpulse-logo.png";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center">
          <img
            src={logo}
            alt="ClassPulse"
            className="h-14 w-auto object-contain sm:h-16"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          <a
            href="#features"
            className="font-inter text-base font-medium text-text-secondary transition hover:text-primary lg:text-lg"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="font-inter text-base font-medium text-text-secondary transition hover:text-primary lg:text-lg"
          >
            How It Works
          </a>

          <a
            href="#earlywarning"
            className="font-inter text-base font-medium text-text-secondary transition hover:text-primary lg:text-lg"
          >
            Early Warning
          </a>

          <a
            href="#about"
            className="font-inter text-base font-medium text-text-secondary transition hover:text-primary lg:text-lg"
          >
            About
          </a>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 font-inter text-base font-semibold text-primary transition hover:bg-blue-50 lg:text-lg"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-dark lg:px-6 lg:py-3"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-lg p-2 text-text-secondary transition hover:bg-blue-50 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-7 w-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-7 w-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-border bg-surface px-6 py-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-3">

            <a
              href="#features"
              onClick={closeMenu}
              className="rounded-lg px-3 py-2 font-inter text-base font-medium text-text-secondary transition hover:bg-blue-50 hover:text-primary"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              onClick={closeMenu}
              className="rounded-lg px-3 py-2 font-inter text-base font-medium text-text-secondary transition hover:bg-blue-50 hover:text-primary"
            >
              How It Works
            </a>

            <a
              href="#earlywarning"
              onClick={closeMenu}
              className="rounded-lg px-3 py-2 font-inter text-base font-medium text-text-secondary transition hover:bg-blue-50 hover:text-primary"
            >
              Early Warning
            </a>

            <a
              href="#about"
              onClick={closeMenu}
              className="rounded-lg px-3 py-2 font-inter text-base font-medium text-text-secondary transition hover:bg-blue-50 hover:text-primary"
            >
              About
            </a>

            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-lg px-4 py-3 text-center font-inter text-base font-semibold text-primary transition hover:bg-blue-50"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="rounded-lg bg-primary px-5 py-3 text-center font-semibold text-white transition hover:bg-primary-dark"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;