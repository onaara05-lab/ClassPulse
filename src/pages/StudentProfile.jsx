import { useState, useEffect, useCallback } from "react";
import StudentSidebar from "../components/Student/StudentSidebar";
import { supabase } from "../supabaseClient";
import { LuLoader, LuUser } from "react-icons/lu";

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

      // 2. Fetch profile from Supabase 'students' or 'profiles' table
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // Log query error if it isn't simply a missing record
        console.error("Supabase profile fetch error:", error);
      }

      // Compute initials from full name or fallback
      const fullName = data?.full_name || user.user_metadata?.full_name || "Student Name";
      const nameParts = fullName.trim().split(" ");
      const initials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : fullName.slice(0, 2).toUpperCase();

      setProfile({
        name: fullName,
        matricNumber: data?.matric_number || user.user_metadata?.matric_number || "N/A",
        role: "Student",
        initials,
        email: user.email || "N/A",
        department: data?.department || "Computer Science",
        faculty: data?.faculty || "Computing",
        level: data?.level ? `${data.level} Level` : "300 Level",
        semester: data?.semester || "Second Semester 2025/2026",
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
      <main className="min-h-screen lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Profile
            </h1>

            {/* Mobile Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Profile Card Container */}
          {loading ? (
            <div className="flex max-w-xl flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
              <LuLoader className="mb-3 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading profile...</p>
            </div>
          ) : !profile ? (
            <div className="flex max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
              <LuUser className="mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium">Unable to load profile information.</p>
            </div>
          ) : (
            <div className="max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {/* Header / Avatar Info */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-sm sm:h-16 sm:w-16 sm:text-xl">
                  {profile.initials}
                </div>

                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-slate-900">
                    {profile.name}
                  </h2>
                  <p className="text-xs font-medium text-slate-400">
                    {profile.matricNumber}
                  </p>
                  <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
                    {profile.role}
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-400">Email</span>
                  <span className="font-semibold text-slate-800">
                    {profile.email}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-400">Department</span>
                  <span className="font-semibold text-slate-800">
                    {profile.department}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-400">Faculty</span>
                  <span className="font-semibold text-slate-800">
                    {profile.faculty}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-400">Level</span>
                  <span className="font-semibold text-slate-800">
                    {profile.level}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-400">Semester</span>
                  <span className="font-semibold text-slate-800">
                    {profile.semester}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentProfile;