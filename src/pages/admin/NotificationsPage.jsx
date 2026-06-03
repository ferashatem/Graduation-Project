import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { HiBell, HiUser, HiUserGroup, HiGlobe } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import { sendAdminNotification } from "../../api/notificationsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import apiClient from "../../api/apiClient";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Analytics & Reports" }, { label: "Send Notifications" }];

const BROADCAST_TARGETS = [
  { value: "All",      label: "All Users"     },
  { value: "Students", label: "All Students"  },
  { value: "Doctors",  label: "All Doctors"   },
  { value: "Admins",   label: "All Admins"    },
];

function StatusAlert({ success, error }) {
  if (error)   return <Alert severity="error"   sx={{ mt: 1 }}>{error}</Alert>;
  if (success) return <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>;
  return null;
}

// ── Tab 0: Broadcast ──────────────────────────────────────────────────────────
function BroadcastTab() {
  const [title,      setTitle]      = useState("");
  const [message,    setMessage]    = useState("");
  const [targetType, setTargetType] = useState("All");
  const [actionUrl,  setActionUrl]  = useState("");
  const [busy,       setBusy]       = useState(false);
  const [success,    setSuccess]    = useState("");
  const [error,      setError]      = useState("");

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await sendAdminNotification({
        title:      title.trim(),
        message:    message.trim(),
        targetType,
        actionUrl:  actionUrl.trim() || null,
      });
      setSuccess("Notification broadcast successfully!");
      setTitle(""); setMessage(""); setActionUrl(""); setTargetType("All");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="space-y-4">
      <TextField label="Title *"   value={title}   onChange={(e) => setTitle(e.target.value)}   fullWidth size="small" />
      <TextField label="Message *" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={3} size="small" />
      <FormControl fullWidth size="small">
        <InputLabel>Target Audience</InputLabel>
        <Select value={targetType} label="Target Audience" onChange={(e) => setTargetType(e.target.value)}>
          {BROADCAST_TARGETS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField label="Action URL (optional)" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} fullWidth size="small" placeholder="e.g. /student/courses" />
      <StatusAlert success={success} error={error} />
      <Button variant="contained" onClick={handleSend} disabled={busy || !title.trim() || !message.trim()} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <HiBell />}>
        {busy ? "Sending…" : "Broadcast"}
      </Button>
    </Box>
  );
}

// ── Tab 1: Single User ────────────────────────────────────────────────────────
function SingleUserTab() {
  const [userId,    setUserId]    = useState("");
  const [title,     setTitle]     = useState("");
  const [message,   setMessage]   = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [busy,      setBusy]      = useState(false);
  const [success,   setSuccess]   = useState("");
  const [error,     setError]     = useState("");

  const handleSend = async () => {
    if (!userId.trim() || !title.trim() || !message.trim()) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await apiClient.post("/Notification", {
        userId:    userId.trim(),
        title:     title.trim(),
        message:   message.trim(),
        actionUrl: actionUrl.trim() || null,
      });
      setSuccess("Notification sent to user!");
      setUserId(""); setTitle(""); setMessage(""); setActionUrl("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="space-y-4">
      <TextField label="User ID *" value={userId} onChange={(e) => setUserId(e.target.value)} fullWidth size="small" placeholder="Paste the user's ID…" />
      <TextField label="Title *"   value={title}   onChange={(e) => setTitle(e.target.value)}   fullWidth size="small" />
      <TextField label="Message *" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={3} size="small" />
      <TextField label="Action URL (optional)" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} fullWidth size="small" placeholder="e.g. /student/grades" />
      <StatusAlert success={success} error={error} />
      <Button variant="contained" onClick={handleSend} disabled={busy || !userId.trim() || !title.trim() || !message.trim()} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <HiUser />}>
        {busy ? "Sending…" : "Send to User"}
      </Button>
    </Box>
  );
}

// ── Tab 2: By Department ──────────────────────────────────────────────────────
function DepartmentTab() {
  const [departments,   setDepartments]   = useState([]);
  const [deptLoading,   setDeptLoading]   = useState(true);
  const [departmentId,  setDepartmentId]  = useState("");
  const [role,          setRole]          = useState("Students");
  const [title,         setTitle]         = useState("");
  const [message,       setMessage]       = useState("");
  const [actionUrl,     setActionUrl]     = useState("");
  const [busy,          setBusy]          = useState(false);
  const [success,       setSuccess]       = useState("");
  const [error,         setError]         = useState("");

  useEffect(() => {
    fetchAllDepartments()
      .then((d) => setDepartments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setDeptLoading(false));
  }, []);

  const handleSend = async () => {
    if (!departmentId || !title.trim() || !message.trim()) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await sendAdminNotification({
        title:        title.trim(),
        message:      message.trim(),
        targetType:   role,
        departmentId,
        actionUrl:    actionUrl.trim() || null,
      });
      setSuccess(`Notification sent to ${role} in the selected department!`);
      setTitle(""); setMessage(""); setActionUrl("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="space-y-4">
      <FormControl fullWidth size="small" disabled={deptLoading}>
        <InputLabel>{deptLoading ? "Loading departments…" : "Department *"}</InputLabel>
        <Select value={departmentId} label={deptLoading ? "Loading departments…" : "Department *"} onChange={(e) => setDepartmentId(e.target.value)}>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name ?? d.code ?? d.id}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>Send To</InputLabel>
        <Select value={role} label="Send To" onChange={(e) => setRole(e.target.value)}>
          <MenuItem value="Students">Students in Department</MenuItem>
          <MenuItem value="Doctors">Doctors in Department</MenuItem>
          <MenuItem value="All">All in Department</MenuItem>
        </Select>
      </FormControl>

      <TextField label="Title *"   value={title}   onChange={(e) => setTitle(e.target.value)}   fullWidth size="small" />
      <TextField label="Message *" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={3} size="small" />
      <TextField label="Action URL (optional)" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} fullWidth size="small" placeholder="e.g. /student/schedule" />
      <StatusAlert success={success} error={error} />
      <Button variant="contained" onClick={handleSend} disabled={busy || !departmentId || !title.trim() || !message.trim()} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <HiUserGroup />}>
        {busy ? "Sending…" : "Send to Department"}
      </Button>
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TAB_ICONS = [HiGlobe, HiUser, HiUserGroup];
const TAB_LABELS = ["Broadcast", "Single User", "By Department"];

function NotificationsPage() {
  const { t } = useTranslation();
  const breadcrumbs = [{ label: t("adminNav.secAnalytics") }, { label: t("adminNotifications.title") }];
  const [tab, setTab] = useState(0);

  return (
    <div className="space-y-5">
      <PageHeader title={t("adminNotifications.title")} breadcrumbs={breadcrumbs} />

      <Paper variant="outlined" sx={{ maxWidth: 640, borderRadius: 3, overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 3, pt: 3, pb: 1 }}>
          <HiBell style={{ fontSize: 22, color: "#2d5be3" }} />
          <Typography variant="subtitle1" fontWeight={700}>Send Notification</Typography>
        </Box>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          {TAB_LABELS.map((label, i) => {
            const Icon = TAB_ICONS[i];
            return (
              <Tab key={label} label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Icon style={{ fontSize: 15 }} />
                  <span>{label}</span>
                </Box>
              } />
            );
          })}
        </Tabs>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {tab === 0 && <BroadcastTab />}
          {tab === 1 && <SingleUserTab />}
          {tab === 2 && <DepartmentTab />}
        </Box>
      </Paper>
    </div>
  );
}

export default NotificationsPage;
