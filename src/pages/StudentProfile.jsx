import { useState, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import StudentSidebar from "../components/Student/StudentSidebar";
import { supabase } from "../supabaseClient";
import { LuLoader, LuUser } from "react-icons/lu";
import logo from "../assets/classpulse-logo.png";

function StudentProfile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentProfile = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Get currently authenticated user session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError || new Error("User not found");

      // Student and lecturer account details are stored in the shared profiles table.
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, matric_number, department, faculty, level, semester")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Supabase profile fetch error:", error);
      }

      const fullName = data?.full_name || user.user_metadata?.full_name || "Student Name";
      const matricNumber = data?.matric_number || user.user_metadata?.matric_number || "";
      const department = data?.department || user.user_metadata?.department || "";
      const faculty = data?.faculty || user.user_metadata?.faculty || "";
      const level = data?.level || user.user_metadata?.level || "";
      const semester = data?.semester || user.user_metadata?.semester || "";

      // Compute initials from full name or fallback
      const nameParts = fullName.trim().split(" ");
      const initials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : fullName.slice(0, 2).toUpperCase();

      setProfile({
        name: fullName,
        matricNumber: matricNumber || "N/A",
        role: "Student",
        initials,
        email: user.email || "N/A",
        department: department || "N/A",
        faculty: faculty || "N/A",
        level: level ? `${String(level).replace(/\s*level$/i, "")} Level` : "N/A",
        semester: semester || "N/A",
      });
    } catch (err) {
      console.error("Error loading student profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchStudentProfile();
    })();
  }, [fetchStudentProfile]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
        <div className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text-primary"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <img src={logo} alt="ClassPulse" className="h-14 w-auto object-contain sm:h-16" />
              </div>
              <span className="text-lg font-bold text-text-primary">ClassPulse</span>
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LuUser size={23} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Profile</h1>
                <p className="mt-1 text-sm text-text-secondary">
                  View your student profile details and account information.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Card Container */}
          {loading ? (
            <div className="flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12 text-text-secondary shadow-sm">
              <LuLoader className="mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading profile...</p>
            </div>
          ) : !profile ? (
            <div className="flex max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
              <LuUser className="mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium">Unable to load profile information.</p>
            </div>
          ) : (
            /* DISPLAY PROFILE VIEW */
            <div className="max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
              {/* Header / Avatar Info */}
              <div className="flex items-center gap-4 border-b border-border pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-sm sm:h-16 sm:w-16 sm:text-xl">
                  {profile.initials}
                </div>

                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-text-primary">{profile.name}</h2>
                  <p className="text-xs text-text-secondary">Matric Number: {profile.matricNumber}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600">
                    {profile.role}
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="divide-y divide-border border-t border-border text-sm">
                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-text-secondary">Email</span>
                  <span className="text-right font-semibold text-text-primary">{profile.email}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-text-secondary">Department</span>
                  <span className="text-right font-semibold text-text-primary">{profile.department}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-text-secondary">Faculty</span>
                  <span className="text-right font-semibold text-text-primary">{profile.faculty}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-text-secondary">Level</span>
                  <span className="text-right font-semibold text-text-primary">{profile.level}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <span className="text-text-secondary">Semester</span>
                  <span className="text-right font-semibold text-text-primary">{profile.semester}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentProfile;