import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
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
  Typography,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import apiClient from "../../api/apiClient";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Audit Logs" }];

const ENTITY_OPTIONS = [
  "",
  "Student",
  "Doctor",
  "Admin",
  "Exam",
  "Grade",
  "Enrollment",
  "Subject",
  "College",
  "Department",
];
const ACTION_OPTIONS = [
  "",
  "Create",
  "Update",
  "Delete",
  "Restore",
  "Login",
  "Logout",
];

const fmtDate = (s) => {
  try {
    return new Date(s).toLocaleString("en-US");
  } catch {
    return s ?? "—";
  }
};

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");

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
      setLogs(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, userIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const actionColor = (action) => {
    const a = action?.toLowerCase() ?? "";
    if (a.includes("delete")) return "error";
    if (a.includes("create")) return "success";
    if (a.includes("update")) return "warning";
    return "default";
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Audit Logs" breadcrumbs={breadcrumbs} />

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
          <MenuItem value="">All Entities</MenuItem>
          {ENTITY_OPTIONS.filter(Boolean).map((e) => (
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
          <MenuItem value="">All Actions</MenuItem>
          {ACTION_OPTIONS.filter(Boolean).map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </Select>
        <TextField
          size="small"
          placeholder="Filter by User ID…"
          value={userIdFilter}
          onChange={(e) => {
            setUserIdFilter(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 200 }}
        />
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
            {total} entries found
          </Typography>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Action</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Entity</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Entity ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Performed By</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Changes</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Chip
                        label={log.actionType}
                        size="small"
                        color={actionColor(log.actionType)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.entityName}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                      >
                        {log.entityId?.slice(0, 16)}…
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                      >
                        {log.performedByUserId?.slice(0, 16)}…
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {fmtDate(log.performedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.newValues && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {typeof log.newValues === "string"
                            ? log.newValues
                            : JSON.stringify(log.newValues)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No audit logs found.
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
              Previous
            </button>
            <Typography variant="body2">
              Page {page} of {totalPages}
            </Typography>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </Box>
        </>
      )}
    </div>
  );
}

export default AuditLogsPage;
