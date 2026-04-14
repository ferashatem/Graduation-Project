import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { setAttendance } from "../../firebase/attendanceFunctions";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/errorHelpers";
import EngagementTracker from "../../components/engagement/EngagementTracker";

const INSTRUCTOR_ROLES = ["super_admin", "admin", "professor", "assistant", "prof"];

const STATUS_OPTIONS = [
  { value: "present", label: "Present", style: "bg-emerald-600" },
  { value: "late", label: "Late", style: "bg-amber-500" },
  { value: "absent", label: "Absent", style: "bg-red-500" },
  { value: "excused", label: "Excused", style: "bg-slate-500" },
];

const formatCount = (value) => (Number.isFinite(value) ? value : 0);

function SessionDetailsPage() {
  const { sessionId } = useParams();
  const { role } = useAuth();

  const [session, setSession] = useState(null);
  const [offering, setOffering] = useState(null);
  const [attendanceAgg, setAttendanceAgg] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState("");

  const canManage = useMemo(
    () => INSTRUCTOR_ROLES.includes(role || ""),
    [role]
  );

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");

    try {
      const sessionSnap = await getDoc(doc(db, "sessions", sessionId));
      if (!sessionSnap.exists()) {
        setSession(null);
        setOffering(null);
        return;
      }

      const sessionData = { id: sessionSnap.id, ...sessionSnap.data() };
      setSession(sessionData);

      if (sessionData.offeringId) {
        const offeringSnap = await getDoc(
          doc(db, "offerings", sessionData.offeringId)
        );
        setOffering(offeringSnap.exists() ? offeringSnap.data() : null);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load session."));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadStudents = useCallback(async () => {
    try {
      const studentsSnap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "student"),
          limit(50)
        )
      );
      setStudents(
        studentsSnap.docs.map((snapshot) => ({
          id: snapshot.id,
          ...snapshot.data(),
        }))
      );
    } catch (err) {
      console.warn("Unable to load students list", err);
    }
  }, []);

  useEffect(() => {
    loadSession();
    loadStudents();
  }, [loadSession, loadStudents]);

  useEffect(() => {
    if (!sessionId) return;
    const aggRef = doc(db, "attendanceAgg_session", sessionId);
    const unsubscribe = onSnapshot(
      aggRef,
      (snapshot) => {
        setAttendanceAgg(snapshot.exists() ? snapshot.data() : null);
      },
      (err) => {
        console.warn("Attendance aggregate subscription failed", err);
      }
    );
    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("sessionId", "==", sessionId)
    );
    const unsubscribe = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const nextMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() || {};
          if (data.studentId) {
            nextMap[data.studentId] = data;
          }
        });
        setAttendanceMap(nextMap);
      },
      (err) => {
        console.warn("Attendance subscription failed", err);
      }
    );
    return () => unsubscribe();
  }, [sessionId]);

  const handleMarkAttendance = useCallback(
    async (studentId, status) => {
      if (!session?.id || !session?.offeringId) return;
      if (!canManage) {
        setActionError("You do not have permission to update attendance.");
        return;
      }

      setSavingId(studentId);
      setActionError("");

      try {
        await setAttendance({
          sessionId: session.id,
          offeringId: session.offeringId,
          studentId,
          status,
          method: "manual",
        });
      } catch (err) {
        setActionError(getErrorMessage(err, "Failed to update attendance."));
      } finally {
        setSavingId("");
      }
    },
    [canManage, session?.id, session?.offeringId]
  );

  if (loading) return <Loading label="Loading session..." />;
  if (error) return <ErrorState message={error} onRetry={loadSession} />;

  if (!session) {
    return <ErrorState message="Session not found." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Session Details"
        breadcrumbs={[
          { label: "Offering", to: `/offerings/${session.offeringId}/dashboard` },
          { label: "Session" },
        ]}
      />

      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-4">
          <span>
            Offering:{" "}
            <Link
              className="font-semibold text-[#0b2c4a]"
              to={`/offerings/${session.offeringId}/dashboard`}
            >
              {session.offeringId}
            </Link>
          </span>
          {offering ? (
            <span>
              Course:{" "}
              <span className="font-semibold text-slate-800">
                {offering.courseId || "N/A"}
              </span>
            </span>
          ) : null}
          <span>
            Start:{" "}
            <span className="font-semibold text-slate-800">
              {session.startTime?.toDate
                ? session.startTime.toDate().toLocaleString("en-US")
                : "N/A"}
            </span>
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-800">
            Attendance Summary
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              Present:{" "}
              <span className="font-semibold text-slate-800">
                {formatCount(attendanceAgg?.presentCount)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              Late:{" "}
              <span className="font-semibold text-slate-800">
                {formatCount(attendanceAgg?.lateCount)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              Absent:{" "}
              <span className="font-semibold text-slate-800">
                {formatCount(attendanceAgg?.absentCount)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              Excused:{" "}
              <span className="font-semibold text-slate-800">
                {formatCount(attendanceAgg?.excusedCount)}
              </span>
            </div>
          </div>
        </div>

        <EngagementTracker
          sessionId={session.id}
          offeringId={session.offeringId}
        />
      </div>

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Student</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No students loaded. TODO: filter by offering enrollment.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const currentAttendance = attendanceMap[student.id];
                const statusLabel = currentAttendance?.status || "unmarked";
                return (
                  <tr key={student.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium">
                      {student.name || student.fullName || student.email || "N/A"}
                    </td>
                    <td className="px-4 py-3">{student.email || "-"}</td>
                    <td className="px-4 py-3 capitalize">{statusLabel}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              handleMarkAttendance(student.id, option.value)
                            }
                            disabled={!canManage || savingId === student.id}
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white ${option.style} disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SessionDetailsPage;
