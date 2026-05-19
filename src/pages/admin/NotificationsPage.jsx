import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { HiBell } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import { sendAdminNotification } from "../../api/notificationsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Analytics & Reports" }, { label: "Send Notifications" }];

const TARGET_TYPES = [
  { value: "All", label: "All Users" },
  { value: "Students", label: "All Students" },
  { value: "Doctors", label: "All Doctors" },
  { value: "Admins", label: "All Admins" },
];

function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("All");
  const [actionUrl, setActionUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await sendAdminNotification({
        title: title.trim(),
        message: message.trim(),
        targetType,
        actionUrl: actionUrl.trim() || null,
      });
      setSuccess("Notification sent successfully!");
      setTitle("");
      setMessage("");
      setActionUrl("");
      setTargetType("All");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Send Notifications" breadcrumbs={breadcrumbs} />

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 600, borderRadius: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <HiBell style={{ fontSize: 22, color: "#2d5be3" }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Broadcast Notification
          </Typography>
        </Box>

        <Box className="space-y-4">
          <TextField
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Message *"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>Target Audience</InputLabel>
            <Select
              value={targetType}
              label="Target Audience"
              onChange={(e) => setTargetType(e.target.value)}
            >
              {TARGET_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Action URL (optional)"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. /student/courses"
          />

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Button
            variant="contained"
            onClick={handleSend}
            disabled={busy || !title.trim() || !message.trim()}
            startIcon={<HiBell />}
          >
            {busy ? "Sending…" : "Send Notification"}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default NotificationsPage;
