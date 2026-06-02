import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  HiChevronDown,
  HiChevronRight,
  HiRefresh,
  HiX,
} from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import apiClient from "../../api/apiClient";
import { getErrorMessage } from "../../utils/errorHelpers";

const ENTITY_OPTIONS = [
  "Student",
  "Doctor",
  "Admin",
  "Exam",
  "Grade",
  "Enrollment",
  "Subject",
  "College",
  "Department",
  "Batch",
  "Group",
  "Year",
  "Semester",
];

const ACTION_OPTIONS = [
  "Create",
  "Update",
  "Delete",
  "Restore",
  "Login",
  "Logout",
];

const ACTION_COLORS = {
  create: "success",
  update: "warning",
  delete: "error",
  restore: "info",
  login: "default",
  logout: "default",
};

const fmtDate = (s) => {
  try {
    return new Date(s).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s ?? "—";
  }
};

const truncate = (str, len = 14) =>
  str ? (str.length > len ? str.slice(0, len) + "…" : str) : "—";

function JsonBlock({ label, value, color }) {
  if (!value) return null;
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value;
    }
  }
  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={600}
        sx={{ color, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          mt: 0.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: color === "#ef4444" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${color === "#ef4444" ? "#fecaca" : "#bbf7d0"}`,
          fontSize: "0.72rem",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          maxHeight: 240,
          overflowY: "auto",
          m: 0,
        }}
      >
        {typeof parsed === "object"
          ? JSON.stringify(parsed, null, 2)
          : String(parsed)}
      </Box>
    </Box>
  );
}

function DetailDialog({ log, onClose }) {
  const { t } = useTranslation();
  if (!log) return null;
  const hasChanges = log.oldValues || log.newValues;

  return (
    <Dialog open={!!log} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography fontWeight={700}>{t("auditLogs.logDetails")}</Typography>
          <Chip
            label={log.actionType}
            size="small"
            color={ACTION_COLORS[log.actionType?.toLowerCase()] ?? "default"}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <HiX />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            mb: hasChanges ? 2 : 0,
          }}
        >
          {[
            { label: t("auditLogs.entity"), value: log.entityName },
            { label: t("auditLogs.action"), value: log.actionType },
            {
              label: t("auditLogs.entityId"),
              value: log.entityId,
              mono: true,
            },
            {
              label: t("auditLogs.performedBy"),
              value: log.performedByUserId,
              mono: true,
            },
            { label: t("common.date"), value: fmtDate(log.performedAt) },
          ].map(({ label, value, mono }) => (
            <Box key={label}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {label}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: mono ? "monospace" : "inherit", mt: 0.25 }}
              >
                {value || "—"}
              </Typography>
            </Box>
          ))}
        </Box>

        {hasChanges && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography fontWeight={600} mb={1.5}>
              {t("auditLogs.changes")}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <JsonBlock
                label={t("auditLogs.oldValues")}
                value={log.oldValues}
                color="#ef4444"
              />
              <JsonBlock
                label={t("auditLogs.newValues")}
                value={log.newValues}
                color="#22c55e"
              />
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LogRow({ log, onSelect }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasChanges = log.oldValues || log.newValues;

  let parsedNew = log.newValues;
  if (typeof parsedNew === "string") {
    try {
      parsedNew = JSON.parse(parsedNew);
    } catch {
      /* keep as string */
    }
  }

  const changesSummary = parsedNew
    ? Object.keys(
        typeof parsedNew === "object" ? parsedNew : {}
      )
        .slice(0, 4)
        .join(", ")
    : null;

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: "pointer", "& td": { borderBottom: expanded ? 0 : undefined } }}
        onClick={() => onSelect(log)}
      >
        <TableCell sx={{ width: 36, pr: 0 }}>
          {hasChanges && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? (
                <HiChevronDown size={14} />
              ) : (
                <HiChevronRight size={14} />
              )}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Chip
            label={log.actionType ?? "—"}
            size="small"
            color={ACTION_COLORS[log.actionType?.toLowerCase()] ?? "default"}
          />
        </TableCell>
        <TableCell>
          <Chip label={log.entityName ?? "—"} size="small" variant="outlined" />
        </TableCell>
        <TableCell>
          <Tooltip title={log.entityId ?? ""} placement="top">
            <Typography
              variant="caption"
              sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
            >
              {truncate(log.entityId)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Tooltip title={log.performedByUserId ?? ""} placement="top">
            <Typography
              variant="caption"
              sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
            >
              {truncate(log.performedByUserId)}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Typography variant="caption">{fmtDate(log.performedAt)}</Typography>
        </TableCell>
        <TableCell>
          {changesSummary && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                maxWidth: 180,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {changesSummary}
            </Typography>
          )}
        </TableCell>
      </TableRow>

      {hasChanges && (
        <TableRow>
          <TableCell colSpan={7} sx={{ py: 0, px: 2 }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  py: 2,
                }}
              >
                <JsonBlock
                  label={t("auditLogs.oldValues")}
                  value={log.oldValues}
                  color="#ef4444"
                />
                <JsonBlock
                  label={t("auditLogs.newValues")}
                  value={log.newValues}
                  color="#22c55e"
                />
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const debounceRef = useRef(null);
  const { t } = useTranslation();
  const breadcrumbs = [{ label: t("auditLogs.title") }];

  const handleUserIdChange = (val) => {
    setUserIdInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setUserIdFilter(val);
      setPage(1);
    }, 500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/auditlogs", {
        params: {
          page,
          pageSize: 20,
          entity: entityFilter || undefined,
          action: actionFilter || undefined,
          userId: userIdFilter || undefined,
        },
      });
      const data = res.data;
      // API may return { data: [...] } or { items: [...] } or a direct array
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
        ? data.items
        : [];
      setLogs(items);
      setTotal(data.total ?? data.totalCount ?? items.length);
      setTotalPages(data.totalPages ?? data.pageCount ?? 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, userIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader title={t("auditLogs.title")} breadcrumbs={breadcrumbs} />

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Select
          size="small"
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">{t("auditLogs.allEntities")}</MenuItem>
          {ENTITY_OPTIONS.map((e) => (
            <MenuItem key={e} value={e}>
              {e}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          displayEmpty
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">{t("auditLogs.allActions")}</MenuItem>
          {ACTION_OPTIONS.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </Select>

        <TextField
          size="small"
          placeholder={t("auditLogs.filterByUserId")}
          value={userIdInput}
          onChange={(e) => handleUserIdChange(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <Tooltip title={t("common.refresh")}>
          <IconButton onClick={load} size="small" disabled={loading}>
            <HiRefresh size={18} className={loading ? "animate-spin" : ""} />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && (
        <Box className="flex justify-center py-16">
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <Typography variant="body2" color="text.secondary">
            {t("common.entriesFound", { count: total })}
          </Typography>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ width: 36 }} />
                  <TableCell>
                    <strong>{t("auditLogs.action")}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t("auditLogs.entity")}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t("auditLogs.entityId")}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t("auditLogs.performedBy")}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t("common.date")}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t("auditLogs.changedFields")}</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <LogRow key={log.id} log={log} onSelect={setSelectedLog} />
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {t("auditLogs.noLogs")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {t("common.previous")}
            </button>
            <Typography variant="body2">
              {t("common.page")} {page} {t("common.of")} {totalPages}
            </Typography>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {t("common.next")}
            </button>
          </Box>
        </>
      )}

      <DetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

export default AuditLogsPage;
