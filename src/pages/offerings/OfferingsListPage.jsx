import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  collectionGroup,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import {
  coursesCollection,
  departmentsCollection,
  yearsCollection,
} from "../../firebase/firestorePaths";
import { fetchColleges } from "../../firebase/firestoreColleges";
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

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

function OfferingsListPage() {
  const { role } = useAuth();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [termId, setTermId] = useState("");
  const [section, setSection] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [colleges, setColleges] = useState([]);
  const [years, setYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);

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

  useEffect(() => {
    let isActive = true;
    setOptionsError("");
    fetchColleges()
      .then((data) => {
        if (!isActive) return;
        setColleges(data);
      })
      .catch((err) => {
        if (!isActive) return;
        setOptionsError(getErrorMessage(err, "Failed to load colleges."));
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    setYears([]);
    setDepartments([]);
    setCourses([]);
    setRooms([]);
    setSelectedYearId("");
    setSelectedDepartmentId("");
    setSelectedCourseId("");
    setSelectedRoomId("");
    setOptionsError("");

    if (!selectedCollegeId) {
      setYearsLoading(false);
      setRoomsLoading(false);
      return;
    }

    setYearsLoading(true);
    setRoomsLoading(true);

    const loadYears = async () => {
      try {
        const yearsQuery = query(yearsCollection(selectedCollegeId), orderBy("order"));
        const snapshot = await getDocs(yearsQuery);
        if (!isActive) return;
        const rows = snapshot.docs.map(mapDoc);
        rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setYears(rows);
      } catch (err) {
        if (!isActive) return;
        setOptionsError(getErrorMessage(err, "Failed to load years."));
      } finally {
        if (isActive) setYearsLoading(false);
      }
    };

    const loadRooms = async () => {
      try {
        const roomsQuery = query(
          collectionGroup(db, "rooms"),
          where("collegeId", "==", selectedCollegeId)
        );
        const snapshot = await getDocs(roomsQuery);
        if (!isActive) return;
        const rows = snapshot.docs.map(mapDoc);
        rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setRooms(rows);
      } catch (err) {
        if (!isActive) return;
        setOptionsError(getErrorMessage(err, "Failed to load rooms."));
      } finally {
        if (isActive) setRoomsLoading(false);
      }
    };

    loadYears();
    loadRooms();

    return () => {
      isActive = false;
    };
  }, [selectedCollegeId]);

  useEffect(() => {
    let isActive = true;
    setDepartments([]);
    setCourses([]);
    setSelectedDepartmentId("");
    setSelectedCourseId("");
    setOptionsError("");

    if (!selectedCollegeId || !selectedYearId) {
      setDepartmentsLoading(false);
      return;
    }

    setDepartmentsLoading(true);

    const loadDepartments = async () => {
      try {
        const snapshot = await getDocs(
          query(
            departmentsCollection(selectedCollegeId, selectedYearId),
            orderBy("name")
          )
        );
        if (!isActive) return;
        setDepartments(snapshot.docs.map(mapDoc));
      } catch (err) {
        if (!isActive) return;
        setOptionsError(getErrorMessage(err, "Failed to load departments."));
      } finally {
        if (isActive) setDepartmentsLoading(false);
      }
    };

    loadDepartments();

    return () => {
      isActive = false;
    };
  }, [selectedCollegeId, selectedYearId]);

  useEffect(() => {
    let isActive = true;
    setCourses([]);
    setSelectedCourseId("");
    setOptionsError("");

    if (!selectedCollegeId || !selectedYearId || !selectedDepartmentId) {
      setCoursesLoading(false);
      return;
    }

    setCoursesLoading(true);

    const loadCourses = async () => {
      try {
        const snapshot = await getDocs(
          query(
            coursesCollection(
              selectedCollegeId,
              selectedYearId,
              selectedDepartmentId
            ),
            orderBy("name")
          )
        );
        if (!isActive) return;
        setCourses(snapshot.docs.map(mapDoc));
      } catch (err) {
        if (!isActive) return;
        setOptionsError(getErrorMessage(err, "Failed to load courses."));
      } finally {
        if (isActive) setCoursesLoading(false);
      }
    };

    loadCourses();

    return () => {
      isActive = false;
    };
  }, [selectedCollegeId, selectedYearId, selectedDepartmentId]);

  const emptyMessage = useMemo(
    () => "No offerings yet. Create one using the form.",
    []
  );

  const resetForm = useCallback(() => {
    setTermId("");
    setSection("");
    setInstructorId("");
    setSelectedCollegeId("");
    setSelectedYearId("");
    setSelectedDepartmentId("");
    setSelectedCourseId("");
    setSelectedRoomId("");
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

      const trimmedCourseId = selectedCourseId.trim();
      const trimmedTermId = termId.trim();
      const trimmedSection = section.trim();
      const trimmedInstructorId = instructorId.trim();
      const trimmedCollegeId = selectedCollegeId.trim();
      const trimmedYearId = selectedYearId.trim();
      const trimmedDepartmentId = selectedDepartmentId.trim();
      const trimmedRoomId = selectedRoomId.trim();

      if (!trimmedCollegeId || !trimmedYearId || !trimmedDepartmentId) {
        setFormError("College, year, and department are required.");
        return;
      }

      if (!trimmedCourseId || !trimmedTermId || !trimmedSection || !trimmedInstructorId) {
        setFormError(
          "Course, term, section, and instructor ID are required."
        );
        return;
      }

      const payload = {
        courseId: trimmedCourseId,
        termId: trimmedTermId,
        section: trimmedSection,
        instructorId: trimmedInstructorId,
        collegeId: trimmedCollegeId,
        yearId: trimmedYearId,
        departmentId: trimmedDepartmentId,
        createdAt: serverTimestamp(),
      };

      if (trimmedRoomId) payload.roomId = trimmedRoomId;

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
      instructorId,
      loadOfferings,
      resetForm,
      selectedCollegeId,
      selectedCourseId,
      selectedDepartmentId,
      selectedRoomId,
      selectedYearId,
      section,
      termId,
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
            onClick={() => {
              setFormOpen((prev) => !prev);
              setFormError("");
              setFormSuccess("");
              setOptionsError("");
            }}
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

          {optionsError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {optionsError}
            </div>
          ) : null}

          <form onSubmit={handleCreateOffering} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              College *
              <select
                value={selectedCollegeId}
                onChange={(event) => setSelectedCollegeId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select college</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name || college.code || college.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Year *
              <select
                value={selectedYearId}
                onChange={(event) => setSelectedYearId(event.target.value)}
                disabled={!selectedCollegeId || yearsLoading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {yearsLoading ? "Loading years..." : "Select year"}
                </option>
                {years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name || year.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Department *
              <select
                value={selectedDepartmentId}
                onChange={(event) => setSelectedDepartmentId(event.target.value)}
                disabled={!selectedYearId || departmentsLoading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {departmentsLoading ? "Loading departments..." : "Select department"}
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name || department.code || department.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Course *
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                disabled={!selectedDepartmentId || coursesLoading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {coursesLoading ? "Loading courses..." : "Select course"}
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code ? `${course.code} - ${course.name || ""}` : course.name || course.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Room
              <select
                value={selectedRoomId}
                onChange={(event) => setSelectedRoomId(event.target.value)}
                disabled={!selectedCollegeId || roomsLoading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {roomsLoading ? "Loading rooms..." : "Select room"}
                </option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name || room.id}
                    {room.buildingId ? ` (Building ${room.buildingId})` : ""}
                  </option>
                ))}
              </select>
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
