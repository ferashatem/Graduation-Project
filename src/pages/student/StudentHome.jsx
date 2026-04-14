import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { HiBookOpen } from "react-icons/hi";

function StudentHome() {
  const { user, profile, profileLoading } = useOutletContext() || {};

  const name = useMemo(
    () => profile?.fullName || profile?.name || user?.displayName || "Student",
    [profile, user]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-[#0b2c4a]">Welcome, {name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile?.collegeId ? `College ID: ${profile.collegeId}` : ""}
          {profile?.year ? ` · Year ${profile.year}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/student/courses"
          className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-blue-300"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <HiBookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">My Courses</p>
            <p className="text-xs text-slate-500">View your registered courses</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default StudentHome;
