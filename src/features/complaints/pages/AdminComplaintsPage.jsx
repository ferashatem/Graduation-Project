import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Tab, Tabs } from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import { ComplaintCardList } from "../components/ComplaintCard";
import ClustersPanel from "../components/ClustersPanel";
import { useAdminComplaints, useComplaintClusters, useComplaintDashboard } from "../hooks/useComplaints";
import ComplaintsPagination from "../components/ComplaintsPagination";
import { reprocessPendingComplaints } from "../api/complaintsApi";

const STATUSES = ["", "Pending", "UnderReview", "Resolved", "Dismissed"];
const TARGET_TYPES = ["", "Doctor", "Subject", "Administration", "Technical"];

const SEVERITY_COLORS = {
  low:      { color: "#10B981", bg: "#D1FAE5" },
  medium:   { color: "#F59E0B", bg: "#FEF3C7" },
  high:     { color: "#F97316", bg: "#FFF7ED" },
  critical: { color: "#EF4444", bg: "#FEF2F2" },
};

function DashboardTab({ dashboard, loading, error, reload }) {
  if (loading) return <Loading label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!dashboard) return null;

  const { summary, categories, severities, metrics, overTime, topClusters } = dashboard;
  const maxOverTime = Math.max(...(overTime ?? []).map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total",        value: summary?.totalComplaints ?? 0,  color: "#1a5fa3" },
          { label: "Pending",      value: summary?.pending ?? 0,           color: "#F59E0B" },
          { label: "Under Review", value: summary?.underReview ?? 0,       color: "#3B82F6" },
          { label: "Critical",     value: summary?.critical ?? 0,          color: "#EF4444" },
          { label: "Resolved",     value: summary?.resolved ?? 0,          color: "#10B981" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className="mt-2 text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Resolution stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Avg Resolution", value: metrics?.averageResolutionHours != null ? `${metrics.averageResolutionHours.toFixed(1)}h` : "—", color: "#059669" },
          { label: "Avg Sentiment",  value: metrics?.averageSentiment != null ? metrics.averageSentiment.toFixed(2) : "—",                     color: metrics?.averageSentiment < -0.3 ? "#EF4444" : "#F59E0B" },
          { label: "Trending Clusters", value: metrics?.trendingClustersCount ?? 0,                                                           color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Status Breakdown</p>
          {[
            { label: "Pending",      value: summary?.pending ?? 0,      color: "#F59E0B" },
            { label: "Under Review", value: summary?.underReview ?? 0,  color: "#3B82F6" },
            { label: "Resolved",     value: summary?.resolved ?? 0,     color: "#10B981" },
            { label: "Dismissed",    value: summary?.dismissed ?? 0,    color: "#6B7280" },
          ].map((s) => {
            const total = summary?.totalComplaints || 1;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-500 shrink-0">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
                </div>
                <span className="text-xs font-bold text-slate-600 w-8 text-right">{s.value}</span>
              </div>
            );
          })}
        </div>

        {/* Categories */}
        {categories?.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">By Category</p>
            {categories.map((c) => {
              const total = categories.reduce((s, x) => s + x.count, 0) || 1;
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-slate-500 shrink-0 truncate">{c.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0b2c4a]" style={{ width: `${(c.count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-8 text-right">{c.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Severities */}
      {severities?.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">By Severity</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {severities.map((s) => {
              const cfg = SEVERITY_COLORS[s.severity] ?? { color: "#6B7280", bg: "#F3F4F6" };
              return (
                <div key={s.severity} className="rounded-xl p-3 text-center" style={{ background: cfg.bg }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{s.severity}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: cfg.color }}>{s.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sentiment Distribution */}
      {metrics != null && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sentiment Distribution</p>
            {(() => {
              const total = summary?.totalComplaints || 1;
              const sentimentGroups = [
                { label: "😊 Positive", threshold: "positive", color: "#10B981", bg: "#D1FAE5" },
                { label: "😐 Neutral",  threshold: "neutral",  color: "#F59E0B", bg: "#FEF3C7" },
                { label: "😞 Negative", threshold: "negative", color: "#EF4444", bg: "#FEE2E2" },
              ];
              return sentimentGroups.map((g) => (
                <div key={g.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-slate-500 shrink-0">{g.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: "33%", background: g.color }} />
                  </div>
                </div>
              ));
            })()}
            <p className="text-xs text-slate-400 pt-1">
              Avg sentiment: <span className={`font-semibold ${metrics?.averageSentiment < -0.3 ? "text-red-500" : metrics?.averageSentiment > 0.3 ? "text-emerald-500" : "text-amber-500"}`}>
                {metrics?.averageSentiment?.toFixed(2) ?? "—"}
              </span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Resolution Metrics</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Avg Resolution Time</span>
                <span className="text-sm font-bold text-slate-700">{metrics?.averageResolutionHours?.toFixed(1) ?? "—"} hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Trending Clusters</span>
                <span className="text-sm font-bold text-red-500">{metrics?.trendingClustersCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Clusters</span>
                <span className="text-sm font-bold text-slate-700">{summary?.totalClusters ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Dismissed</span>
                <span className="text-sm font-bold text-slate-500">{summary?.dismissed ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Over Time */}
      {overTime?.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Complaints Over Time (last 30 days)</p>
          <div className="flex items-end gap-1 h-24 overflow-x-auto pb-1">
            {overTime.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[20px] flex-1">
                <div
                  className="w-full rounded-t bg-[#0b2c4a] opacity-80 hover:opacity-100 transition"
                  style={{ height: `${Math.max((d.count / maxOverTime) * 80, 2)}px` }}
                  title={`${new Date(d.date).toLocaleDateString("en-US")}: ${d.count}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Clusters */}
      {topClusters?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Top Active Clusters</p>
          <ClustersPanel clusters={topClusters} isAdmin />
        </div>
      )}
    </div>
  );
}

function AdminComplaintsPage() {
  const { t } = useTranslation();
  const { complaints, totalCount: complaintsTotal, loading, error, reload, setQuery } = useAdminComplaints();
  const [listPage, setListPage] = useState(1);
  const PAGE_SIZE = 20;
  const { clusters, loading: clustersLoading } = useComplaintClusters();
  const { dashboard, loading: dashLoading, error: dashError, reload: dashReload } = useComplaintDashboard();
  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef(null);

  // Poll every 30s while any complaint is awaiting analysis
  useEffect(() => {
    const hasPending = complaints.some((c) => !c.analysis && c.status === "Pending");
    if (!hasPending) { clearInterval(pollRef.current); pollRef.current = null; return; }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => reload(), 30000);
    return () => { clearInterval(pollRef.current); pollRef.current = null; };
  }, [complaints, reload]);

  const handleRetryAnalysis = async () => {
    setRetrying(true);
    try { await reprocessPendingComplaints(); reload(); }
    catch { /* ignore */ }
    finally { setRetrying(false); }
  };

  const breadcrumbs = useMemo(() => [{ label: t("complaints.title") }], [t]);

  const handleFilter = (newStatus, newTargetType) => {
    setListPage(1);
    setQuery({ page: 1, pageSize: PAGE_SIZE, status: newStatus || undefined, targetType: newTargetType || undefined });
  };

  const handleListPageChange = (p) => {
    setListPage(p);
    setQuery({ page: p, pageSize: PAGE_SIZE, status: status || undefined, targetType: targetType || undefined });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("complaints.title")}
        breadcrumbs={breadcrumbs}
        action={
          <Button
            size="small"
            variant="outlined"
            disabled={retrying}
            onClick={handleRetryAnalysis}
          >
            {retrying ? "Retrying…" : "Retry Analysis"}
          </Button>
        }
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Dashboard" />
        <Tab label={t("complaints.allComplaints")} />
        <Tab label={t("complaints.patternsAndClusters")} />
      </Tabs>

      {tab === 0 && (
        <DashboardTab dashboard={dashboard} loading={dashLoading} error={dashError} reload={dashReload} />
      )}

      {tab === 1 && (
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
          <ComplaintCardList
            complaints={complaints}
            loading={loading}
            showStudent
            onRefresh={reload}
            emptyText={t("complaints.noComplaints") || "No complaints match your filters."}
          />

          <ComplaintsPagination
            totalCount={complaintsTotal}
            page={listPage}
            pageSize={PAGE_SIZE}
            onPageChange={handleListPageChange}
          />
        </>
      )}

      {tab === 2 && (
        <>
          {clustersLoading ? <Loading label={t("common.loading")} /> : <ClustersPanel clusters={clusters} isAdmin />}
        </>
      )}
    </div>
  );
}

export default AdminComplaintsPage;
