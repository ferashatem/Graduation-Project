import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { HiCheck, HiPencil, HiPlus, HiTrash, HiX } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import {
  createAdmin,
  fetchAllAdmins,
  updateAdmin,
  deleteAdmin,
  activateAdmin,
  deactivateAdmin,
} from "../../api/adminsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Admins Management" }];

function CreateAdminDialog({ open, onClose, onCreated }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setError("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Full name, email, and password are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createAdmin({ fullName, email, password });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Admin</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          fullWidth
          autoFocus
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving}>
          {saving ? "Creating…" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditAdminDialog({ admin, open, onClose, onSaved }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && admin) {
      setFullName(admin.fullName ?? "");
      setEmail(admin.email ?? "");
      setError("");
    }
  }, [open, admin]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateAdmin(admin.id, { fullName, email });
      onSaved({ ...admin, fullName, email });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Admin</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AdminsManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllAdmins();
      setAdmins(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (admin) => {
    try {
      if (admin.isActive) {
        await deactivateAdmin(admin.id);
      } else {
        await activateAdmin(admin.id);
      }
      setAdmins((prev) =>
        prev.map((a) => a.id === admin.id ? { ...a, isActive: !a.isActive } : a)
      );
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete admin "${admin.fullName}"? This cannot be undone.`)) return;
    try {
      await deleteAdmin(admin.id);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Admins Management" breadcrumbs={breadcrumbs} />
        <Button
          variant="contained"
          startIcon={<HiPlus />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Add Admin
        </Button>
      </div>

      {loading && (
        <Box className="flex justify-center py-16"><CircularProgress /></Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "slate.50" }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{admin.fullName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{admin.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={admin.role ?? "Admin"} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={admin.isActive ? "Active" : "Inactive"}
                      size="small"
                      color={admin.isActive ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <IconButton size="small" onClick={() => setEditTarget(admin)} title="Edit">
                        <HiPencil />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggle(admin)}
                        title={admin.isActive ? "Deactivate" : "Activate"}
                        color={admin.isActive ? "warning" : "success"}
                      >
                        {admin.isActive ? <HiX /> : <HiCheck />}
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(admin)} title="Delete" color="error">
                        <HiTrash />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No admins found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateAdminDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newAdmin) => {
          setAdmins((prev) => [newAdmin, ...prev]);
        }}
      />

      <EditAdminDialog
        admin={editTarget}
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSaved={(updated) => {
          setAdmins((prev) => prev.map((a) => a.id === updated.id ? updated : a));
          setEditTarget(null);
        }}
      />
    </div>
  );
}

export default AdminsManagementPage;
