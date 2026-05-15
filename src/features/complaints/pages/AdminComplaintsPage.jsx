import { useMemo, useState } from "react";
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
  const { complaints, loading, error, reload, setQuery } = useAdminComplaints();
  const { clusters, loading: clustersLoading } = useComplaintClusters();
  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");

  const breadcrumbs = useMemo(() => [{ label: "Complaints" }], []);

  const handleFilter = (newStatus, newTargetType) => {
    setQuery({ page: 1, pageSize: 20, status: newStatus || undefined, targetType: newTargetType || undefined });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Complaints" breadcrumbs={breadcrumbs} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="All Complaints" />
        <Tab label="Patterns & Clusters" />
      </Tabs>

      {tab === 0 && (
        <>
          <Box className="flex flex-wrap gap-3">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => { setStatus(e.target.value); handleFilter(e.target.value, targetType); }}
              >
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s || "All"}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Target Type</InputLabel>
              <Select
                value={targetType}
                label="Target Type"
                onChange={(e) => { setTargetType(e.target.value); handleFilter(status, e.target.value); }}
              >
                {TARGET_TYPES.map((t) => <MenuItem key={t} value={t}>{t || "All"}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
          {loading && complaints.length === 0 ? (
            <Loading label="Loading complaints…" />
          ) : (
            <ComplaintsTable rows={complaints} loading={loading} showStudent />
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {clustersLoading ? <Loading label="Loading patterns…" /> : <ClustersPanel clusters={clusters} />}
        </>
      )}
    </div>
  );
}

export default AdminComplaintsPage;
