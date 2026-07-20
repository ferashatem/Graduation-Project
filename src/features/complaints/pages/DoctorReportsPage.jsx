import { useMemo, useEffect, useRef, useState } from "react";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import { ComplaintCardList } from "../components/ComplaintCard";
import ClustersPanel from "../components/ClustersPanel";
import ComplaintsPagination from "../components/ComplaintsPagination";
import { useComplaintClusters, useDoctorReports } from "../hooks/useComplaints";
import { useAuthUser } from "../../../auth/useAuthUser";

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

  const handleClose = () => { setText(""); setError(""); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Reply to Complaint</DialogTitle>
      <DialogContent className="space-y-3 !pt-4">
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        {complaint && (
          <div className="rounded-xl bg-slate-50 p-3 space-y-1 mb-2">
            <p className="text-xs font-bold text-slate-700">{complaint.title}</p>
            <p className="text-xs text-slate-400">Student: Anonymous (privacy protected)</p>
            {complaint.analysis?.aiSummary && (
              <p className="text-xs text-slate-500 mt-1">AI Summary: {complaint.analysis.aiSummary}</p>
            )}
            {complaint.analysis?.suggestedAction && (
              <p className="text-xs text-slate-400 italic">💡 {complaint.analysis.suggestedAction}</p>
            )}
          </div>
        )}

        <TextField
          label="Your Reply"
          multiline
          rows={4}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputProps={{ maxLength: 2000 }}
          helperText={`${text.length} / 2000`}
          aria-required="true"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !text.trim()}>
          {loading ? "Sending…" : "Send Reply"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DoctorReportsPage() {
  const { user } = useAuthUser();
  const { complaints, totalCount, loading, error, reload, reply, statusFilter, setStatusFilter, setQuery, page, pageSize, pendingCount } = useDoctorReports();
  const { clusters, loading: clustersLoading } = useComplaintClusters({
    targetType: "Doctor",
    targetId: user?.id || undefined,
  });
  const [tab, setTab] = useState(0);
  const [replyTarget, setReplyTarget] = useState(null);
  const pollRef = useRef(null);

  // Poll every 30s while any complaint is awaiting AI analysis
  useEffect(() => {
    const hasPending = complaints.some((c) => !c.analysis && c.status === "Pending");
    if (!hasPending) { clearInterval(pollRef.current); pollRef.current = null; return; }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => reload(), 30000);
    return () => { clearInterval(pollRef.current); pollRef.current = null; };
  }, [complaints, reload]);

  const breadcrumbs = useMemo(() => [{ label: "Complaint Reports" }], []);

  const resolved  = complaints.filter((c) => c.status === "Resolved").length;
  const critical  = complaints.filter((c) => c.priority === "Critical").length;
  const trending  = clusters.filter((c) => c.trendDirection === "Increasing").length;

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

      {/* Stats row */}
      {!loading && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Total",    value: totalCount,  color: "#1a5fa3" },
            { label: "Critical", value: critical,    color: "#EF4444" },
            { label: "Resolved", value: resolved,    color: "#10B981" },
            { label: "Trending Clusters", value: trending, color: "#F97316" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Complaints Against Me" />
        <Tab label={`Patterns & Clusters${clusters.length > 0 ? ` (${clusters.length})` : ""}`} />
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
            <ToggleButton value="UnderReview">Under Review</ToggleButton>
            <ToggleButton value="Resolved">Resolved</ToggleButton>
          </ToggleButtonGroup>

          {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}

          <ComplaintCardList
            complaints={complaints}
            loading={loading}
            showStudent={true}
            onReply={setReplyTarget}
            onRefresh={reload}
            emptyText="No complaints have been filed against you."
          />

          <ComplaintsPagination
            totalCount={totalCount}
            page={page ?? 1}
            pageSize={pageSize ?? 20}
            onPageChange={(p) => setQuery((prev) => ({ ...prev, page: p }))}
          />
        </>
      )}

      {tab === 1 && (
        <>
          {clustersLoading
            ? <Loading label="Loading patterns…" />
            : <ClustersPanel clusters={clusters} isAdmin={false} />
          }
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
