import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardActions,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import BuildingFormModal from "../../components/campusBuildings/BuildingFormModal";
import {
  createCampusBuilding,
  deleteCampusBuilding,
  getCampusBuildings,
  updateCampusBuilding,
} from "../../services/campusBuildingsAdmin.service";
import { getErrorMessage } from "../../utils/errorHelpers";

function BuildingsList() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [confirmState, setConfirmState] = useState({ open: false, building: null });
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = useCallback((message, severity = "success") => {
    setToast({ open: true, message, severity });
  }, []);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  const loadBuildings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCampusBuildings();
      setBuildings(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load buildings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);

  const filteredBuildings = useMemo(() => {
    if (!normalizedSearch) return buildings;
    return buildings.filter((b) => {
      const name = String(b?.name || "").toLowerCase();
      const code = String(b?.code || "").toLowerCase();
      return name.includes(normalizedSearch) || code.includes(normalizedSearch);
    });
  }, [buildings, normalizedSearch]);

  const handleOpenAddModal = useCallback(() => {
    setEditingBuilding(null);
    setFormError("");
    setModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((building) => {
    setEditingBuilding(building);
    setFormError("");
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
    setEditingBuilding(null);
  }, [saving]);

  const handleSubmit = useCallback(
    async (values) => {
      setSaving(true);
      setFormError("");
      try {
        if (editingBuilding?.id) {
          await updateCampusBuilding(editingBuilding.id, values);
          showToast("Building updated successfully.");
        } else {
          await createCampusBuilding(values);
          showToast("Building added successfully.");
        }
        await loadBuildings();
        setModalOpen(false);
        setEditingBuilding(null);
      } catch (err) {
        setFormError(getErrorMessage(err, "Failed to save building."));
      } finally {
        setSaving(false);
      }
    },
    [editingBuilding, loadBuildings, showToast]
  );

  const handleDeletePrompt = useCallback((building) => {
    setConfirmState({ open: true, building });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, building: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmState.building?.id) return;
    setDeleting(true);
    try {
      await deleteCampusBuilding(confirmState.building.id);
      showToast("Building deleted successfully.");
      await loadBuildings();
      handleCloseConfirm();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete building."), "error");
    } finally {
      setDeleting(false);
    }
  }, [confirmState.building, handleCloseConfirm, loadBuildings, showToast]);

  const handleOpenDetails = useCallback(
    (buildingId) => {
      if (!buildingId) return;
      navigate(`/admin/campus-buildings/${buildingId}`);
    },
    [navigate]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campus Buildings"
        breadcrumbs={[
          { label: "Admin", to: "/admin/home" },
          { label: "Campus Buildings" },
        ]}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddModal}>
            Add Building
          </Button>
        }
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </div>

      {loading ? (
        <Loading label="Loading buildings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadBuildings} />
      ) : filteredBuildings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No buildings found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBuildings.map((building) => (
            <Card
              key={building.id}
              className="rounded-2xl shadow-sm ring-1 ring-slate-200"
            >
              <CardActionArea onClick={() => handleOpenDetails(building.id)}>
                <CardContent>
                  <Typography variant="h6" className="text-slate-800">
                    {building.name || "Untitled Building"}
                  </Typography>
                  <Typography variant="body2" className="text-slate-500">
                    {building.code ? `Code: ${building.code}` : "No code set"}
                  </Typography>
                </CardContent>
              </CardActionArea>
              <CardActions className="justify-end">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(building);
                  }}
                  title="Edit building"
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePrompt(building);
                  }}
                  title="Delete building"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </div>
      )}

      <BuildingFormModal
        open={modalOpen}
        initialValues={editingBuilding}
        existingBuildings={buildings}
        loading={saving}
        error={formError}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete building?"
        message={`This will permanently delete "${confirmState.building?.name}" along with all its floors and rooms.`}
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={hideToast}>
        <Alert onClose={hideToast} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default BuildingsList;
