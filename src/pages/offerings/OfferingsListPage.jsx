import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/errorHelpers";

const formatCreatedAt = (timestamp) => {
  if (!timestamp) return "-";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US");
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US");
  }
  return "-";
};

function OfferingsListPage() {
  const { role } = useAuth();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [courseId, setCourseId] = useState("");
  const [termId, setTermId] = useState("");
  const [section, setSection] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [yearId, setYearId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roomId, setRoomId] = useState("");

  const canManage = useMemo(
    () => ["super_admin", "admin"].includes(role || ""),
    [role]
  );

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const offeringsRef = collection(db, "offerings");
      const offeringsQuery = query(offeringsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(offeringsQuery);
      const rows = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOfferings(rows);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load offerings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const emptyMessage = useMemo(
    () => "No offerings yet. Create one using the form.",
    []
  );

  const resetForm = useCallback(() => {
    setCourseId("");
    setTermId("");
    setSection("");
    setInstructorId("");
    setCollegeId("");
    setYearId("");
    setDepartmentId("");
    setRoomId("");
  }, []);

  const handleCreateOffering = useCallback(
    async (event) => {
      event.preventDefault();
      setFormError("");
      setFormSuccess("");

      if (!canManage) {
        setFormError("Only admins can create offerings.");
        return;
      }

      const trimmedCourseId = courseId.trim();
      const trimmedTermId = termId.trim();
      const trimmedSection = section.trim();
      const trimmedInstructorId = instructorId.trim();

      if (!trimmedCourseId || !trimmedTermId || !trimmedSection || !trimmedInstructorId) {
        setFormError("Course, term, section, and instructor ID are required.");
        return;
      }

      const payload = {
        courseId: trimmedCourseId,
        termId: trimmedTermId,
        section: trimmedSection,
        instructorId: trimmedInstructorId,
        createdAt: serverTimestamp(),
      };

      if (collegeId.trim()) payload.collegeId = collegeId.trim();
      if (yearId.trim()) payload.yearId = yearId.trim();
      if (departmentId.trim()) payload.departmentId = departmentId.trim();
      if (roomId.trim()) payload.roomId = roomId.trim();

      setSaving(true);

      try {
        await addDoc(collection(db, "offerings"), payload);
        setFormSuccess("Offering created successfully.");
        resetForm();
        setFormOpen(false);
        await loadOfferings();
      } catch (err) {
        setFormError(getErrorMessage(err, "Failed to create offering."));
      } finally {
        setSaving(false);
      }
    },
    [
      canManage,
      collegeId,
      courseId,
      departmentId,
      instructorId,
      loadOfferings,
      resetForm,
      roomId,
      section,
      termId,
      yearId,
    ]
  );

  if (loading) return <Loading label="Loading offerings..." />;
  if (error) return <ErrorState message={error} onRetry={loadOfferings} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Offerings"
        action={
          <button
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-xl bg-[#0b2c4a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-[#153a63]"
          >
            {formOpen ? "Close Form" : "Create Offering"}
          </button>
        }
      />

      {formOpen ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">New Offering</h2>
          <p className="mt-1 text-sm text-slate-600">
            Fill the required fields to publish a new offering.
          </p>

          {!canManage ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              You do not have permission to create offerings.
            </div>
          ) : null}

          <form onSubmit={handleCreateOffering} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Course ID *
              <input
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Term ID *
              <input
                value={termId}
                onChange={(event) => setTermId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Section *
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Instructor UID *
              <input
                value={instructorId}
                onChange={(event) => setInstructorId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              College ID
              <input
                value={collegeId}
                onChange={(event) => setCollegeId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Year ID
              <input
                value={yearId}
                onChange={(event) => setYearId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Department ID
              <input
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Room ID
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canManage || saving}
                className="inline-flex items-center justify-center rounded-xl bg-[#0b2c4a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-[#153a63] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Offering"}
              </button>
              {formError ? (
                <span className="text-sm text-red-600">{formError}</span>
              ) : null}
              {formSuccess ? (
                <span className="text-sm text-emerald-600">{formSuccess}</span>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Offering</th>
              <th className="px-4 py-3 text-left font-semibold">Course</th>
              <th className="px-4 py-3 text-left font-semibold">Term</th>
              <th className="px-4 py-3 text-left font-semibold">Section</th>
              <th className="px-4 py-3 text-left font-semibold">Instructor</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {offerings.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              offerings.map((offering) => (
                <tr key={offering.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium">{offering.id}</td>
                  <td className="px-4 py-3">{offering.courseId || "-"}</td>
                  <td className="px-4 py-3">{offering.termId || "-"}</td>
                  <td className="px-4 py-3">{offering.section || "-"}</td>
                  <td className="px-4 py-3">{offering.instructorId || "-"}</td>
                  <td className="px-4 py-3">
                    {formatCreatedAt(offering.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-3">
                      <Link
                        to={`/offerings/${offering.id}/dashboard`}
                        className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b2c4a]"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={`/offerings/${offering.id}/sessions/new`}
                        className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600"
                      >
                        New Session
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OfferingsListPage;
