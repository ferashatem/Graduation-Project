import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Loading from "../../../components/common/Loading";
import { useClusterDetail } from "../hooks/useComplaints";
import { replyToCluster, updateClusterStatus } from "../api/complaintsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

const TREND_CFG = {
  Increasing: { color: "#EF4444", label: "📈 Increasing" },
  Stable:     { color: "#3B82F6", label: "➡ Stable" },
  Decreasing: { color: "#10B981", label: "📉 Decreasing" },
};

const STATUS_CFG = {
  Open:          { color: "#F59E0B", bg: "#FEF3C7" },
  Investigating: { color: "#3B82F6", bg: "#EFF6FF" },
  Resolved:      { color: "#10B981", bg: "#D1FAE5" },
  Archived:      { color: "#6B7280", bg: "#F3F4F6" },
};

const CLUSTER_STATUSES = ["Open", "Investigating", "Resolved", "Archived"];

function SentimentBar({ score }) {
  if (score == null) return null;
  const pct = ((score + 1) / 2) * 100;
  const color = score > 0.3 ? "#10B981" : score > -0.3 ? "#F59E0B" : "#EF4444";
  const label = score > 0.3 ? "Positive" : score > -0.3 ? "Neutral" : "Negative";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{score.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ReplySection({ clusterId, complaintCount, onReplied }) {
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSend = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await replyToCluster(clusterId, text.trim());
      setSuccess(`Reply sent to ${result?.notificationsSent ?? complaintCount} students.`);
      setText("");
      setConfirming(false);
      onReplied?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Typography variant="subtitle2" fontWeight={700}>Send Reply to All Students</Typography>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {!success && (
        <>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Write your response to all students in this cluster…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            inputProps={{ maxLength: 2000 }}
          />
          {!confirming ? (
            <Button
              variant="outlined"
              color="primary"
              disabled={!text.trim()}
              onClick={() => setConfirming(true)}
            >
              Reply to {complaintCount} students
            </Button>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-sm text-amber-800 font-medium">
                This will resolve all {complaintCount} complaints in this cluster and notify every student. Continue?
              </p>
              <div className="flex gap-2">
                <Button variant="contained" color="warning" onClick={handleSend} disabled={loading} size="small">
                  {loading ? <CircularProgress size={16} /> : "Confirm & Send"}
                </Button>
                <Button onClick={() => setConfirming(false)} size="small" disabled={loading}>Cancel</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusSection({ clusterId, currentStatus, onChanged }) {
  const [status, setStatus] = useState(currentStatus ?? "Open");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    setLoading(true);
    setError("");
    try {
      await updateClusterStatus(clusterId, status, reason || undefined);
      onChanged?.(status);
      setReason("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Typography variant="subtitle2" fontWeight={700}>Update Status</Typography>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      <div className="flex gap-2 flex-wrap">
        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          {CLUSTER_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
        <TextField
          size="small"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ flex: 1, minWidth: 180 }}
          inputProps={{ maxLength: 500 }}
        />
        <Button variant="contained" onClick={handleUpdate} disabled={loading || status === currentStatus} size="small">
          {loading ? <CircularProgress size={16} /> : "Update"}
        </Button>
      </div>
    </div>
  );
}

function ClusterDetailModal({ clusterId, open, onClose, isAdmin = false }) {
  const { detail, loading, error, reload } = useClusterDetail(open ? clusterId : null);

  const trendCfg = TREND_CFG[detail?.trendDirection] ?? {};
  const statusCfg = STATUS_CFG[detail?.status] ?? {};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold">{detail?.topic ?? "Cluster Detail"}</span>
          {detail?.status && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: statusCfg.color, background: statusCfg.bg }}
            >
              {detail.status}
            </span>
          )}
          {detail?.trendDirection && (
            <span className="text-xs font-semibold" style={{ color: trendCfg.color }}>
              {trendCfg.label}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 shrink-0">
          {detail?.complaintCount ?? 0} complaints
          {detail?.criticalCount > 0 && ` · ${detail.criticalCount} critical`}
        </div>
      </DialogTitle>

      <DialogContent dividers className="space-y-6">
        {loading && <Loading label="Loading cluster details…" />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && detail && (
          <>
            {/* AI Summary */}
            <div className="space-y-2">
              <Typography variant="subtitle2" fontWeight={700}>AI Summary</Typography>
              <p className="text-sm text-slate-600">{detail.aiSummary}</p>
              <SentimentBar score={detail.averageSentiment} />
            </div>

            {/* AI Recommendations */}
            {detail.aiRecommendations?.length > 0 && (
              <div className="space-y-2">
                <Typography variant="subtitle2" fontWeight={700}>AI Recommendations</Typography>
                <ul className="space-y-1.5">
                  {detail.aiRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 shrink-0 text-violet-500">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Status History */}
            {detail.statusHistory?.length > 0 && (
              <div className="space-y-2">
                <Typography variant="subtitle2" fontWeight={700}>Status History</Typography>
                <div className="space-y-2">
                  {detail.statusHistory.map((h, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-400">{h.oldStatus}</span>
                      <span className="mx-2">→</span>
                      <span className="font-semibold text-slate-800">{h.newStatus}</span>
                      {h.reason && <span className="ml-2 text-slate-400">— {h.reason}</span>}
                      <span className="ml-auto block text-right text-slate-400">
                        {new Date(h.changedAt).toLocaleString("en-US")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Replies */}
            {detail.replies?.length > 0 && (
              <div className="space-y-2">
                <Typography variant="subtitle2" fontWeight={700}>Previous Replies</Typography>
                <div className="space-y-2">
                  {detail.replies.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm space-y-1">
                      <p className="text-slate-700">{r.message}</p>
                      <p className="text-xs text-slate-400">
                        Sent to {r.notificationsSent} students · {new Date(r.repliedAt).toLocaleString("en-US")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Section */}
            {detail.status !== "Resolved" && detail.status !== "Archived" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <ReplySection
                  clusterId={clusterId}
                  complaintCount={detail.complaintCount}
                  onReplied={reload}
                />
              </div>
            )}

            {/* Status Update (admin only) */}
            {isAdmin && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <StatusSection
                  clusterId={clusterId}
                  currentStatus={detail.status}
                  onChanged={(newStatus) => reload()}
                />
              </div>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ClusterDetailModal;
