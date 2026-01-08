import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { getErrorMessage } from "../../utils/errorHelpers";
import { fetchAllCourses } from "./courseService";

const normalizeString = (value) => String(value ?? "").toLowerCase().trim();

function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAllCourses(db);
      setCourses(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const normalizedQuery = useMemo(
    () => normalizeString(searchTerm),
    [searchTerm]
  );

  const filteredCourses = useMemo(() => {
    if (!normalizedQuery) return courses;
    return courses.filter((course) => {
      const values = [
        course?.name,
        course?.code,
        course?.department,
        course?.departmentName,
      ];
      return values.some((value) =>
        normalizeString(value).includes(normalizedQuery)
      );
    });
  }, [courses, normalizedQuery]);

  const emptyMessage = useMemo(() => {
    if (normalizedQuery) return "No courses match your search.";
    return "No courses found.";
  }, [normalizedQuery]);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleRowClick = useCallback(
    (courseId) => {
      if (!courseId) return;
      navigate(`/courses/${courseId}`);
    },
    [navigate]
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Courses" />

      {error && !loading ? (
        <ErrorState message={error} onRetry={loadCourses} />
      ) : null}

      {loading && courses.length === 0 ? (
        <Loading label="Loading courses..." />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">All courses</h2>
              <p className="text-sm text-slate-500">Browse the full catalog.</p>
            </div>
            <div className="w-full sm:w-72">
              <input
                type="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, code, or department"
                aria-label="Search courses"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">Code</th>
                  <th className="px-4 py-3 text-start">Name</th>
                  <th className="px-4 py-3 text-start">Credit Hours</th>
                  <th className="px-4 py-3 text-start">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-sm text-slate-500"
                      colSpan={4}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="cursor-pointer transition hover:bg-slate-50/60"
                      onClick={() => handleRowClick(course.id)}
                    >
                      <td className="px-4 py-3 font-medium">
                        {course?.code ?? "-"}
                      </td>
                      <td className="px-4 py-3">{course?.name ?? "-"}</td>
                      <td className="px-4 py-3">
                        {course?.creditHours ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {course?.department ?? course?.departmentName ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursesPage;
