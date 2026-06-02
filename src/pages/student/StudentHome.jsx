import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { fetchStudentDashboard } from "../../api/analyticsApi";

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1.5 text-3xl font-bold text-slate-800">{value ?? "—"}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        {icon(color)}
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { to: "/student/courses",    label: "My Courses",    desc: "Materials & enrollment",    bg: "bg-blue-50",    text: "text-blue-600" },
  { to: "/student/grades",     label: "My Grades",     desc: "View your marks & GPA",     bg: "bg-emerald-50", text: "text-emerald-600" },
  { to: "/student/attendance", label: "Attendance",    desc: "Check-in & report",         bg: "bg-amber-50",   text: "text-amber-600" },
  { to: "/student/assignments",label: "Assignments",   desc: "Submit your work",          bg: "bg-violet-50",  text: "text-violet-600" },
  { to: "/student/quizzes",    label: "Quizzes",       desc: "Upcoming & past exams",     bg: "bg-sky-50",     text: "text-sky-600" },
  { to: "/student/roadmap",    label: "Roadmap",       desc: "Academic progress map",     bg: "bg-rose-50",    text: "text-rose-600" },
];

function StudentHome() {
  const { user, profile } = useOutletContext() || {};
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);

  const name = useMemo(
    () => profile?.fullName || profile?.name || user?.displayName || "Student",
    [profile, user]
  );

  useEffect(() => {
    fetchStudentDashboard()
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gpa         = dashboard?.currentGpa ?? dashboard?.gpa ?? null;
  const attendance  = dashboard?.overallAttendance ?? dashboard?.attendancePercentage ?? null;
  const courses     = dashboard?.enrolledCourses ?? dashboard?.enrolledCoursesCount ?? null;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0b2c4a] to-[#1a5fa3] p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Welcome back, {name} 👋</h1>
        <p className="mt-1 text-sm text-white/60">
          {profile?.universityStudentId ? `ID: ${profile.universityStudentId}` : ""}
          {profile?.year ? ` · Year ${profile.year}` : ""}
          {profile?.collegeName ? ` · ${profile.collegeName}` : ""}
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Current GPA"
            value={gpa != null ? gpa.toFixed(2) : "—"}
            sub="out of 4.0"
            color="#0b2c4a"
            icon={(c) => (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={c}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            )}
          />
          <StatCard
            label="Enrolled Courses"
            value={courses ?? "—"}
            sub="this semester"
            color="#059669"
            icon={(c) => (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={c}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          />
          <StatCard
            label="Attendance"
            value={attendance != null ? `${Math.round(attendance)}%` : "—"}
            sub={attendance != null && attendance < 75 ? "⚠ Below 75% threshold" : "overall average"}
            color={attendance != null && attendance < 75 ? "#ef4444" : "#7c3aed"}
            icon={(c) => (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={c}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            )}
          />
        </div>
      )}

      {/* Recent subjects from dashboard */}
      {!loading && dashboard?.subjectDetails?.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">My Subjects</h2>
            <Link to="/student/courses" className="text-xs font-semibold text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {dashboard.subjectDetails.slice(0, 5).map((s, i) => (
              <div key={s.subjectId ?? i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.subjectName ?? "Subject"}</p>
                  <p className="text-xs text-slate-400">{s.subjectCode ?? ""}{s.doctorName ? ` · Dr. ${s.doctorName}` : ""}</p>
                </div>
                {s.attendancePercentage != null && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    s.attendancePercentage >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  }`}>
                    {Math.round(s.attendancePercentage)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-2xl ${item.bg} p-4 transition hover:opacity-80 ring-1 ring-slate-100`}
            >
              <div className={`text-2xl ${item.text}`}>
                {item.to === "/student/courses"     ? "📚" :
                 item.to === "/student/grades"      ? "📊" :
                 item.to === "/student/attendance"  ? "✅" :
                 item.to === "/student/assignments" ? "📝" :
                 item.to === "/student/quizzes"     ? "🧪" : "🗺️"}
              </div>
              <div>
                <p className={`text-sm font-bold ${item.text}`}>{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
