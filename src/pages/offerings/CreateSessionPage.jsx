import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/errorHelpers";

const INSTRUCTOR_ROLES = ["super_admin", "admin", "professor", "assistant", "prof"];

const toTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
};

function CreateSessionPage() {
  const { offeringId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [offering, setOffering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const canManage = useMemo(
    () => INSTRUCTOR_ROLES.includes(role || ""),
    [role]
  );

  const loadOffering = useCallback(async () => {
    if (!offeringId) return;
    setLoading(true);
    setError("");
    try {
      const snap = await getDoc(doc(db, "offerings", offeringId));
      setOffering(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load offering details."));
    } finally {
      setLoading(false);
    }
  }, [offeringId]);

  useEffect(() => {
    loadOffering();
  }, [loadOffering]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setFormError("");

      if (!offeringId) {
        setFormError("Missing offering id.");
        return;
      }

      if (!canManage) {
        setFormError("You are not allowed to create sessions.");
        return;
      }

      if (!startTime) {
        setFormError("Start time is required.");
        return;
      }

      const startTimestamp = toTimestamp(startTime);
      const endTimestamp = toTimestamp(endTime);

      if (!startTimestamp) {
        setFormError("Start time is invalid.");
        return;
      }

      if (endTime && !endTimestamp) {
        setFormError("End time is invalid.");
        return;
      }

      setSaving(true);

      try {
        const payload = {
          offeringId,
          startTime: startTimestamp,
          createdBy: user?.uid || "",
          createdAt: serverTimestamp(),
        };
        if (endTimestamp) {
          payload.endTime = endTimestamp;
        }

        const ref = await addDoc(collection(db, "sessions"), payload);
        navigate(`/sessions/${ref.id}`);
      } catch (err) {
        setFormError(getErrorMessage(err, "Failed to create session."));
      } finally {
        setSaving(false);
      }
    },
    [canManage, endTime, navigate, offeringId, startTime, user?.uid]
  );

  if (loading) return <Loading label="Loading offering..." />;
  if (error) return <ErrorState message={error} onRetry={loadOffering} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Session"
        breadcrumbs={[
          { label: "Offerings", to: `/offerings/${offeringId}/dashboard` },
          { label: "New session" },
        ]}
      />

      {!offering ? (
        <ErrorState message="Offering not found." />
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 text-sm text-slate-600">
            Creating a session for offering:{" "}
            <span className="font-semibold text-slate-800">{offering.id}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Start time
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              End time (optional)
              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {formError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving || !canManage}
              className="inline-flex items-center justify-center rounded-xl bg-[#0b2c4a] px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-[#153a63] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Creating..." : "Create Session"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CreateSessionPage;
