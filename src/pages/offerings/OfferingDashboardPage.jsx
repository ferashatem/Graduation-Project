import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/errorHelpers";

const INSTRUCTOR_ROLES = ["super_admin", "admin", "professor", "assistant", "prof"];

const formatDateTime = (value) => {
  if (!value) return "-";
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString("en-US");
  }
  return String(value);
};

const renderRateBar = (rate) => {
  const total = 10;
  const filled = Math.round(rate * total);
  return `[${"#".repeat(filled)}${".".repeat(total - filled)}]`;
};

function OfferingDashboardPage() {
  const { offeringId } = useParams();
  const { role } = useAuth();

  const [offering, setOffering] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManage = useMemo(
    () => INSTRUCTOR_ROLES.includes(role || ""),
    [role]
  );

  const loadData = useCallback(async () => {
    if (!offeringId) return;
    setLoading(true);
    setError("");

    try {
      const offeringSnap = await getDoc(doc(db, "offerings", offeringId));
      const offeringData = offeringSnap.exists()
        ? { id: offeringSnap.id, ...offeringSnap.data() }
        : null;

      const sessionsQuery = query(
        collection(db, "sessions"),
        where("offeringId", "==", offeringId),
        orderBy("startTime", "desc")
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      const baseSessions = sessionsSnap.docs.map((snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      }));

      const aggregates = await Promise.all(
        baseSessions.map((session) =>
          getDoc(doc(db, "attendanceAgg_session", session.id))
        )
      );

      const sessionsWithAgg = baseSessions.map((session, index) => {
        const aggSnap = aggregates[index];
        return {
          ...session,
          attendanceAgg: aggSnap.exists() ? aggSnap.data() : null,
        };
      });

      setOffering(offeringData);
      setSessions(sessionsWithAgg);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const emptyMessage = useMemo(() => {
    if (sessions.length === 0) return "No sessions created yet.";
    return "";
  }, [sessions.length]);

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Offering Dashboard"
        breadcrumbs={[{ label: "Offerings" }, { label: offeringId }]}
        action={
          canManage ? (
            <Link
              to={`/offerings/${offeringId}/sessions/new`}
              className="inline-flex items-center justify-center rounded-xl bg-[#0b2c4a] px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-[#153a63]"
            >
              Create Session
            </Link>
          ) : null
        }
      />

      {offering ? (
        <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap gap-4">
            <span>
              Course:{" "}
              <span className="font-semibold text-slate-800">
                {offering.courseId || "N/A"}
              </span>
            </span>
            <span>
              Term:{" "}
              <span className="font-semibold text-slate-800">
                {offering.termId || "N/A"}
              </span>
            </span>
            <span>
              Section:{" "}
              <span className="font-semibold text-slate-800">
                {offering.section || "N/A"}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Session</th>
              <th className="px-4 py-3 text-left font-semibold">Start</th>
              <th className="px-4 py-3 text-left font-semibold">End</th>
              <th className="px-4 py-3 text-left font-semibold">Attendance</th>
              <th className="px-4 py-3 text-left font-semibold">Trend</th>
              <th className="px-4 py-3 text-right font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const rate = session.attendanceAgg?.attendanceRate || 0;
                const rateLabel = `${Math.round(rate * 100)}%`;
                return (
                  <tr key={session.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium">{session.id}</td>
                    <td className="px-4 py-3">
                      {formatDateTime(session.startTime)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDateTime(session.endTime)}
                    </td>
                    <td className="px-4 py-3">{rateLabel}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {renderRateBar(rate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/sessions/${session.id}`}
                        className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b2c4a]"
                      >
                        View
                      </Link>
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

export default OfferingDashboardPage;
