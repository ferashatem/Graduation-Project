import { useMemo } from "react";
import { Tab, Tabs } from "@mui/material";
import { useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import ComplaintsTable from "../components/ComplaintsTable";
import ClustersPanel from "../components/ClustersPanel";
import { useComplaintClusters, useDoctorReports } from "../hooks/useComplaints";

function DoctorReportsPage() {
  const { complaints, loading, error, reload } = useDoctorReports();
  const { clusters, loading: clustersLoading } = useComplaintClusters();
  const [tab, setTab] = useState(0);

  const breadcrumbs = useMemo(() => [{ label: "Complaint Reports" }], []);

  return (
    <div className="space-y-5">
      <PageHeader title="Complaint Reports" breadcrumbs={breadcrumbs} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Complaints Against Me" />
        <Tab label="Patterns & Clusters" />
      </Tabs>

      {tab === 0 && (
        <>
          {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
          {loading && complaints.length === 0 ? (
            <Loading label="Loading reports…" />
          ) : (
            <ComplaintsTable rows={complaints} loading={loading} showStudent={false} />
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

export default DoctorReportsPage;
