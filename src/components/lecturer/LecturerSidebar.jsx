import { NavLink, Link, useNavigate } from "react-router-dom";
import logo from "../../assets/classpulse-logo.png";
import {
  LuLayoutDashboard,
  LuBookOpen,
  LuUsers,
  LuCalendarDays,
  LuClipboardList,
  LuActivity,
  LuShieldAlert,
  LuUserRound,
  LuX,
  LuLogOut,
} from "react-icons/lu";
import { MdBarChart } from "react-icons/md";
import { supabase } from "../../supabaseClient";

function LecturerSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const navigationLinks = [
    {
      name: "Dashboard",
      path: "/lecturer/dashboard",
      icon: LuLayoutDashboard,
    },
    {
      name: "Courses",
      path: "/lecturer/courses",
      icon: LuBookOpen,
    },
    {
      name: "Students",
      path: "/lecturer/students",
      icon: LuUsers,
    },
    {
      name: "Schedule",
      path: "/lecturer/schedule",
      icon: LuCalendarDays,
    },
    {
      name: "Sessions",
      path: "/lecturer/sessions",
      icon: LuClipboardList,
    },
    {
      name: "Monitoring",
      path: "/lecturer/monitoring",
      icon: LuActivity,
    },
    {
      name: "Risk Monitor",
      path: "/lecturer/risk-monitor",
      icon: LuShieldAlert,
    },
    {
      name: "Reports",
      path: "/lecturer/reports",
      icon: MdBarChart,
    },
    {
      name: "Profile",
      path: "/lecturer/profile",
      icon: LuUserRound,
    },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      return;
    }

    onClose?.();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed overflow-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#101A30] text-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <NavLink to="/lecturer/dashboard" className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600"
            >
              <img
                src={logo}
                alt="ClassPulse"
                className="h-14 w-auto object-contain sm:h-16"
              />
            </Link>

            <span className="text-lg font-bold tracking-tight">ClassPulse</span>
          </NavLink>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 overflow-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navigationLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} />

                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 px-3 py-4">
          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LuLogOut size={18} strokeWidth={1.8} />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default LecturerSidebar;
