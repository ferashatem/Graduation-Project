import { useMemo, useState } from "react";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import ComplaintsTable from "../components/ComplaintsTable";
import ClustersPanel from "../components/ClustersPanel";
import { useComplaintClusters, useDoctorReports } from "../hooks/useComplaints";

function ReplyDialog({ open, complaint, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) { setError("Reply cannot be empty."); return; }
    setError("");
    setLoading(true);
    const result = await onSubmit(complaint.id, text.trim());
    setLoading(false);
    if (result.ok) { setText(""); onClose(); }
    else setError(result.error);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Reply to: {complaint?.title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Your reply"
          multiline
          rows={4}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? "Sending…" : "Send Reply"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DoctorReportsPage() {
  const { complaints, loading, error, reload, reply, statusFilter, setStatusFilter, pendingCount } = useDoctorReports();
  const { clusters, loading: clustersLoading } = useComplaintClusters();
  const [tab, setTab] = useState(0);
  const [replyTarget, setReplyTarget] = useState(null);

  const breadcrumbs = useMemo(() => [{ label: "Complaint Reports" }], []);

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Complaint Reports
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </span>
        }
        breadcrumbs={breadcrumbs}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Complaints Against Me" />
        <Tab label="Patterns & Clusters" />
      </Tabs>

      {tab === 0 && (
        <>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, v) => setStatusFilter(v ?? "")}
            size="small"
          >
            <ToggleButton value="">All</ToggleButton>
            <ToggleButton value="Pending">Pending</ToggleButton>
            <ToggleButton value="Resolved">Resolved</ToggleButton>
          </ToggleButtonGroup>

          {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
          {loading && complaints.length === 0 ? (
            <Loading label="Loading reports…" />
          ) : (
            <ComplaintsTable
              rows={complaints}
              loading={loading}
              showStudent={true}
              onReply={setReplyTarget}
            />
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {clustersLoading ? <Loading label="Loading patterns…" /> : <ClustersPanel clusters={clusters} />}
        </>
      )}

      <ReplyDialog
        open={Boolean(replyTarget)}
        complaint={replyTarget}
        onClose={() => setReplyTarget(null)}
        onSubmit={reply}
      />
    </div>
  );
}

export default DoctorReportsPage;
