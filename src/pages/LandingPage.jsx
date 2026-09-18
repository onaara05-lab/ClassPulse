import Navbar from "../components/Navbar";
import FeatureCard from "../components/Feature";
import HowItWorks from "../components/HowItWorks";
import EarlyWarning from "../components/EarlyWarning";
import AboutSection from "../components/AboutSection";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import Heroimage from "../assets/Classroom.jpg";
import {
  FaBell,
  FaClipboardList,
} from "../../node_modules/react-icons/fa";
import {  LuShieldCheck, LuCalendar, LuFileText } from "../../node_modules/react-icons/lu";
import {  MdBarChart } from "../../node_modules/react-icons/md";

function LandingPage() {
  return (
    <main className="min-h-screen bg-background font-inter">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl mt-18 flex-col items-center gap-10 px-6 py-12 md:flex-row">
        {/* Hero Text */}
        <div className="w-full max-w-2xl">
          <p className="mb-4 text-2xl font-extrabold uppercase tracking-wider text-primary">
            Attendance & Early-Warning System
          </p>

          <h1 className="text-6xl font-bold leading-tight text-text-primary">
            Smarter attendance.
            <span className="text-primary"> Better student monitoring.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-text-secondary">
            ClassPulse helps lecturers manage class attendance, monitor student
            participation, and identify attendance problems early.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              to="/register"
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark"
            >
              Get Started
            </Link>

            <a
              href="#features"
              className="rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-text-primary transition hover:border-primary hover:text-primary"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Image */}
        <div className="block w-full max-w-xl overflow-hidden rounded-3xl">
          <img
            src={Heroimage}
            alt="Students in a university classroom"
            className="h-[450px] w-full object-cover"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-background px-6 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Section Heading */}
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-xl font-extrabold uppercase tracking-wider text-primary">
              Powerful Features
            </p>

            <h2 className="text-3xl font-extrabold text-text-primary md:text-4xl">
              Everything you need to manage attendance
            </h2>

            <p className="mt-4 leading-7 text-text-secondary">
              ClassPulse makes it easier to record attendance, monitor students,
              identify risks early, and understand class performance.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FaClipboardList />}
              title="Smart Attendance"
              description="Create and manage secure attendance sessions and easily keep track of students who are present."
            />

            <FeatureCard
              icon={<FaBell />}
              title="Early-Warning Alerts"
              description="Automatically identify students whose attendance falls below the required threshold."
            />

            <FeatureCard
              icon={< MdBarChart />}
              title="Analytics Dashboard"
              description="Comprehensive visual reports on attendance trends across courses, departments and semesters."
            />

            <FeatureCard
              icon={<LuShieldCheck />}
              title="Role-Based Access"
              description="Separate, secure dashboards for students and lecturers with appropriate permissions and views."
            />

            <FeatureCard
              icon={<LuCalendar />}
              title="Schedule Management"
              description="Manage class schedules, set recurring sessions and view upcoming classes at a glance."
            />

            <FeatureCard
              icon={<LuFileText />}
              title="Reports Generation"
              description="Export detailed attendance reports as PDF or CSV for official records and faculty review."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* EarlyWarning */}
      <EarlyWarning />

      {/* About section */}
      <AboutSection />

      {/* Footer section */}
      <Footer />
    </main>
  );
}

export default LandingPage;
