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
  createBuilding,
  deleteBuilding,
  getBuildings,
  updateBuilding,
} from "../../services/buildingsAdmin.service";
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

  const [confirmState, setConfirmState] = useState({
    open: false,
    building: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [actionError, setActionError] = useState("");

  const resolvePermissionError = useCallback((error, path) => {
    const message = error?.message || "";
    if (
      error?.code === "permission-denied" ||
      /missing or insufficient permissions/i.test(message)
    ) {
      console.error("[permissions] access denied", { path, error });
      return "Missing or insufficient permissions. Please contact an administrator.";
    }
    return "";
  }, []);

  const loadBuildings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBuildings();
      setBuildings(data);
    } catch (err) {
      const permissionMessage = resolvePermissionError(err, "buildings");
      setError(
        permissionMessage || getErrorMessage(err, "Failed to load buildings.")
      );
    } finally {
      setLoading(false);
    }
  }, [resolvePermissionError]);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const normalizedSearch = useMemo(
    () => search.trim().toLowerCase(),
    [search]
  );

  const filteredBuildings = useMemo(() => {
    if (!normalizedSearch) return buildings;
    return buildings.filter((building) => {
      const name = String(building?.name || "").toLowerCase();
      const code = String(building?.code || "").toLowerCase();
      return name.includes(normalizedSearch) || code.includes(normalizedSearch);
    });
  }, [buildings, normalizedSearch]);

  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  const handleOpenModal = useCallback(() => {
    setEditingBuilding(null);
    setFormError("");
    setModalOpen(true);
  }, []);

  const handleEditBuilding = useCallback((building) => {
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
      setActionError("");
      try {
        if (editingBuilding?.id) {
          await updateBuilding(editingBuilding.id, values);
        } else {
          await createBuilding(values);
        }
        await loadBuildings();
        setModalOpen(false);
        setEditingBuilding(null);
      } catch (err) {
        const permissionMessage = resolvePermissionError(
          err,
          `buildings/${editingBuilding?.id || ""}`
        );
        setFormError(
          permissionMessage || getErrorMessage(err, "Failed to save building.")
        );
      } finally {
        setSaving(false);
      }
    },
    [editingBuilding, loadBuildings, resolvePermissionError]
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
    setActionError("");
    try {
      await deleteBuilding(confirmState.building.id);
      await loadBuildings();
      handleCloseConfirm();
    } catch (err) {
      const permissionMessage = resolvePermissionError(
        err,
        `buildings/${confirmState.building?.id || ""}`
      );
      setActionError(
        permissionMessage || getErrorMessage(err, "Failed to delete building.")
      );
    } finally {
      setDeleting(false);
    }
  }, [confirmState.building, handleCloseConfirm, loadBuildings, resolvePermissionError]);

  const handleOpenBuilding = useCallback(
    (buildingId) => {
      if (!buildingId) return;
      navigate(`/admin/campus-buildings/${buildingId}`);
    },
    [navigate]
  );

  const handleRetry = useCallback(() => {
    loadBuildings();
  }, [loadBuildings]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campus Buildings"
        breadcrumbs={[
          { label: "Admin", to: "/admin/home" },
          { label: "Campus Buildings" },
        ]}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenModal}>
            Add Building
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={handleSearchChange}
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
        <ErrorState message={error} onRetry={handleRetry} />
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
              <CardActionArea onClick={() => handleOpenBuilding(building.id)}>
                <CardContent>
                  <Typography variant="h6" className="text-slate-800">
                    {building.name || "Untitled building"}
                  </Typography>
                  <Typography variant="body2" className="text-slate-500">
                    {building.code ? `Code: ${building.code}` : "No code set"}
                  </Typography>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Floors: {building.floorsCount || "-"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Rooms/Floor: {building.roomsPerFloor || "-"}
                    </span>
                  </div>
                </CardContent>
              </CardActionArea>
              <CardActions className="justify-end">
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    handleEditBuilding(building);
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeletePrompt(building);
                  }}
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
        message="This will remove the building, its floors, and all rooms."
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default BuildingsList;
