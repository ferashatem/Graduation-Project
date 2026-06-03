import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";

function StudentAttendancePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader title={t("studentAttendance.title")} />
      <div className="rounded-2xl bg-amber-50 p-8 text-center ring-1 ring-amber-200">
        <p className="text-sm font-semibold text-amber-700">
          {t("studentAttendance.featureUnavailable", "Attendance tracking is currently unavailable.")}
        </p>
        <p className="mt-1 text-xs text-amber-500">
          {t("studentAttendance.featureUnavailableHint", "This feature has been temporarily removed. Please check back later.")}
        </p>
      </div>
    </div>
  );
}

export default StudentAttendancePage;
