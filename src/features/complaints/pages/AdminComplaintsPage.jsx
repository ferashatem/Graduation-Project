import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, FormControl, InputLabel, MenuItem, Select, Tab, Tabs } from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import ComplaintsTable from "../components/ComplaintsTable";
import ClustersPanel from "../components/ClustersPanel";
import { useAdminComplaints, useComplaintClusters } from "../hooks/useComplaints";

const STATUSES = ["", "Pending", "Resolved", "Dismissed"];
const TARGET_TYPES = ["", "Doctor", "Exam", "Grade", "SubjectOffering", "Other"];

function AdminComplaintsPage() {
  const { t } = useTranslation();
  const { complaints, loading, error, reload, setQuery } = useAdminComplaints();
  const { clusters, loading: clustersLoading } = useComplaintClusters();
  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");

  const breadcrumbs = useMemo(() => [{ label: t("complaints.title") }], [t]);

  const handleFilter = (newStatus, newTargetType) => {
    setQuery({ page: 1, pageSize: 20, status: newStatus || undefined, targetType: newTargetType || undefined });
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("complaints.title")} breadcrumbs={breadcrumbs} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={t("complaints.allComplaints")} />
        <Tab label={t("complaints.patternsAndClusters")} />
      </Tabs>

      {tab === 0 && (
        <>
          <Box className="flex flex-wrap gap-3">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{t("complaints.status")}</InputLabel>
              <Select
                value={status}
                label={t("complaints.status")}
                onChange={(e) => { setStatus(e.target.value); handleFilter(e.target.value, targetType); }}
              >
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s || t("common.all")}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{t("complaints.targetType")}</InputLabel>
              <Select
                value={targetType}
                label={t("complaints.targetType")}
                onChange={(e) => { setTargetType(e.target.value); handleFilter(status, e.target.value); }}
              >
                {TARGET_TYPES.map((tt) => <MenuItem key={tt} value={tt}>{tt || t("common.all")}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
          {loading && complaints.length === 0 ? (
            <Loading label={t("complaints.loading")} />
          ) : (
            <ComplaintsTable rows={complaints} loading={loading} showStudent />
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {clustersLoading ? <Loading label={t("common.loading")} /> : <ClustersPanel clusters={clusters} />}
        </>
      )}
    </div>
  );
}

export default AdminComplaintsPage;
