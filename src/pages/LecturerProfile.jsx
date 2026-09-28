import { useState, useEffect } from "react";
import { User, Menu, Loader2 } from "lucide-react";

import logo from "../assets/classpulse-logo.png";
import LecturerSidebar from "../components/lecturer/LecturerSidebar";
import { supabase } from "../supabaseClient";

function LecturerProfile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profileDetails, setProfileDetails] = useState({
    name: "",
    staffId: "N/A",
    role: "Lecturer",
    email: "",
    department: "N/A",
    faculty: "N/A",
    coursesTaught: "0 active courses",
    academicYear: "2025/2026",
  });

  // Helper to extract initials (e.g., "Dr. John Doe" -> "JD")
  const getInitials = (name) => {
    if (!name) return "L";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchLecturerProfile() {
      try {
        setLoading(true);
        setError(null);

        // 1. Get authenticated user session
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found.");

        // 2. Query lecturer profile details matching existing schema columns
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, staff_id, department, academic_session, role")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        // 3. Count active courses associated with this lecturer
        const { count: courseCount, error: coursesError } = await supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("lecturer_id", user.id);

        if (coursesError && coursesError.code !== "PGRST116") {
          console.warn("Could not fetch courses count:", coursesError.message);
        }

        if (isMounted) {
          const userMetadata = user.user_metadata || {};

          const resolvedName =
            profile?.full_name ||
            userMetadata.full_name ||
            user.email?.split("@")[0] ||
            "Lecturer";

          const resolvedStaffId =
            profile?.staff_id ||
            userMetadata.staff_id ||
            "N/A";

          const resolvedRole = profile?.role || userMetadata.role || "lecturer";

          const resolvedFaculty =
            userMetadata.faculty ||
            "N/A";

          const resolvedDepartment =
            profile?.department ||
            userMetadata.department ||
            "N/A";

          const resolvedSession =
            profile?.academic_session ||
            userMetadata.academic_session ||
            "2025/2026";

          setProfileDetails({
            name: resolvedName,
            staffId: resolvedStaffId,
            role: resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1),
            email: user.email || "N/A",
            department: resolvedDepartment,
            faculty: resolvedFaculty,
            coursesTaught: `${courseCount || 0} active ${
              courseCount === 1 ? "course" : "courses"
            }`,
            academicYear: resolvedSession,
          });
        }
      } catch (err) {
        console.error("Error fetching lecturer profile:", err);
        if (isMounted) {
          setError(err.message || "Failed to load profile details.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLecturerProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Component */}
      <LecturerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
        {/* Mobile Header Bar - Logo & Sidebar Trigger */}
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

            {/* Mobile Logo Group */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <img
                  src={logo}
                  alt="ClassPulse"
                  className="h-14 w-auto object-contain sm:h-16"
                />
              </div>
              <span className="text-lg font-bold text-text-primary">
                ClassPulse
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
                Profile
              </h1>

              <p className="mt-1 text-sm text-text-secondary">
                View your staff profile details and account information.
              </p>
            </div>
          </div>

          {/* Loading / Error States */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-secondary">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              Loading profile details...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 max-w-2xl">
              {error}
            </div>
          ) : (
            /* Profile Card */
            <div className="max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm">
              {/* User Header Info */}
              <div className="flex items-center gap-4 pb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-sm">
                  {getInitials(profileDetails.name)}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    {profileDetails.name}
                  </h2>

                  <p className="text-xs text-text-secondary">
                    Staff ID: {profileDetails.staffId}
                  </p>

                  <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600">
                    {profileDetails.role}
                  </span>
                </div>
              </div>

              {/* Profile Information List */}
              <div className="divide-y divide-border border-t border-border text-sm">
                <div className="flex justify-between py-4">
                  <span className="text-text-secondary">Email</span>
                  <span className="font-semibold text-text-primary">
                    {profileDetails.email}
                  </span>
                </div>

                <div className="flex justify-between py-4">
                  <span className="text-text-secondary">Department</span>
                  <span className="font-semibold text-text-primary">
                    {profileDetails.department}
                  </span>
                </div>

                <div className="flex justify-between py-4">
                  <span className="text-text-secondary">Faculty</span>
                  <span className="font-semibold text-text-primary">
                    {profileDetails.faculty}
                  </span>
                </div>

                <div className="flex justify-between py-4">
                  <span className="text-text-secondary">Courses Taught</span>
                  <span className="font-semibold text-text-primary">
                    {profileDetails.coursesTaught}
                  </span>
                </div>

                <div className="flex justify-between py-4">
                  <span className="text-text-secondary">Academic Session</span>
                  <span className="font-semibold text-text-primary">
                    {profileDetails.academicYear}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default LecturerProfile;