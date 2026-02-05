import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import BuildingCard from "../../components/Buildings/BuildingCard";
import BuildingFormModal from "../../components/Buildings/BuildingFormModal";
import ConfirmDeleteModal from "../../components/Buildings/ConfirmDeleteModal";
import { fetchColleges } from "../../firebase/firestoreColleges";
import {
  createBuilding,
  deleteBuilding,
  subscribeBuildings,
  updateBuilding,
} from "../../firebase/buildingsApi";
import { subscribeRoomsByCollege } from "../../firebase/roomsApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { useAuth } from "../../context/AuthContext";

function BuildingsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canManage = useMemo(() => role === "admin", [role]);

  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [collegesError, setCollegesError] = useState("");
  const [selectedCollegeId, setSelectedCollegeId] = useState("");

  const [buildings, setBuildings] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [buildingsError, setBuildingsError] = useState("");

  const [roomCounts, setRoomCounts] = useState({});
  const [roomsError, setRoomsError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, building: null });
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;
    setCollegesLoading(true);
    setCollegesError("");
    fetchColleges()
      .then((data) => {
        if (!isActive) return;
        setColleges(data);
      })
      .catch((err) => {
        if (!isActive) return;
        setCollegesError(getErrorMessage(err));
      })
      .finally(() => {
        if (!isActive) return;
        setCollegesLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (selectedCollegeId || colleges.length !== 1) return;
    setSelectedCollegeId(colleges[0].id);
  }, [colleges, selectedCollegeId]);

  useEffect(() => {
    if (!selectedCollegeId) {
      setBuildings([]);
      setBuildingsError("");
      return;
    }

    setBuildingsLoading(true);
    const unsubscribe = subscribeBuildings(
      selectedCollegeId,
      (data) => {
        setBuildings(data);
        setBuildingsLoading(false);
      },
      (error) => {
        setBuildingsError(getErrorMessage(error));
        setBuildingsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedCollegeId]);

  useEffect(() => {
    if (!selectedCollegeId) {
      setRoomCounts({});
      setRoomsError("");
      return;
    }

    const unsubscribe = subscribeRoomsByCollege(
      selectedCollegeId,
      (rooms) => {
        const counts = rooms.reduce((acc, room) => {
          if (!room.buildingId) return acc;
          acc[room.buildingId] = (acc[room.buildingId] || 0) + 1;
          return acc;
        }, {});
        setRoomCounts(counts);
      },
      (error) => {
        setRoomsError(getErrorMessage(error));
      }
    );

    return () => unsubscribe();
  }, [selectedCollegeId]);

  const breadcrumbs = useMemo(() => [{ label: "Buildings" }], []);

  const handleCollegeChange = useCallback((event) => {
    setSelectedCollegeId(event.target.value);
    setActionError("");
  }, []);

  const handleOpenRooms = useCallback(
    (building) => {
      if (!building?.id || !selectedCollegeId) return;
      navigate(`/buildings/${building.id}/rooms?collegeId=${selectedCollegeId}`, {
        state: { collegeId: selectedCollegeId, buildingName: building.name || "" },
      });
    },
    [navigate, selectedCollegeId]
  );

  const handleOpenViewer = useCallback(() => {
    if (!selectedCollegeId) return;
    navigate(`/buildings/viewer?collegeId=${selectedCollegeId}`, {
      state: { collegeId: selectedCollegeId },
    });
  }, [navigate, selectedCollegeId]);

  const handleAdd = useCallback(() => {
    setEditing(null);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((building) => {
    setEditing(building);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
  }, []);

  const handleDeletePrompt = useCallback((building) => {
    setConfirmState({ open: true, building });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, building: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.building;
    if (!target || !selectedCollegeId) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteBuilding(selectedCollegeId, target.id);
      handleCloseConfirm();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }, [confirmState.building, handleCloseConfirm, selectedCollegeId]);

  const handleSubmit = useCallback(
    async (values) => {
      const targetCollegeId = values.collegeId || selectedCollegeId;
      if (!targetCollegeId) {
        setActionError("College is required.");
        return;
      }
      setSaving(true);
      setActionError("");
      try {
        if (editing?.id) {
          await updateBuilding(targetCollegeId, editing.id, {
            name: values.name,
            code: values.code,
          });
        } else {
          await createBuilding(targetCollegeId, {
            name: values.name,
            code: values.code,
          });
        }
        setDialogOpen(false);
        setEditing(null);
      } catch (err) {
        setActionError(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    },
    [editing, selectedCollegeId]
  );

  const collegePlaceholder = useMemo(() => {
    if (collegesLoading) return "Loading colleges...";
    if (colleges.length === 0) return "No colleges found";
    return "Select a college";
  }, [colleges.length, collegesLoading]);

  const editingWithCollege = useMemo(() => {
    if (!editing) return null;
    return {
      ...editing,
      collegeId: editing.collegeId || selectedCollegeId,
    };
  }, [editing, selectedCollegeId]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buildings"
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outlined"
              onClick={handleOpenViewer}
              disabled={!selectedCollegeId}
            >
              3D Viewer
            </Button>
            {canManage ? (
              <Button
                variant="contained"
                onClick={handleAdd}
                disabled={!selectedCollegeId}
              >
                Add Building
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Buildings catalog
            </h2>
            <p className="text-sm text-slate-500">
              Choose a college to manage its buildings.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
              value={selectedCollegeId}
              onChange={handleCollegeChange}
              disabled={collegesLoading}
            >
              <option value="" disabled>
                {collegePlaceholder}
              </option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.code
                    ? `${college.name || "College"} (${college.code})`
                    : college.name || "College"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {/* {roomsError ? <Alert severity="warning">{roomsError}</Alert> : null} */}
      {buildingsError && !buildingsLoading ? (
        <ErrorState message={buildingsError} />
      ) : null}
      {collegesError && !collegesLoading ? (
        <ErrorState message={collegesError} />
      ) : null}

      {collegesLoading && colleges.length === 0 ? (
        <Loading label="Loading colleges..." />
      ) : buildingsLoading && buildings.length === 0 ? (
        <Loading label="Loading buildings..." />
      ) : selectedCollegeId ? (
        buildings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No buildings found for this college.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                roomsCount={roomCounts[building.id]}
                onOpen={handleOpenRooms}
                onEdit={handleEdit}
                onDelete={handleDeletePrompt}
                canManage={canManage}
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Select a college to view its buildings.
        </div>
      )}

      <BuildingFormModal
        open={dialogOpen}
        initialValues={editingWithCollege}
        colleges={colleges}
        defaultCollegeId={selectedCollegeId}
        loading={saving}
        error={actionError}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        open={confirmState.open}
        title="Delete building?"
        message="This will remove the building and all rooms + schedules inside it."
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default BuildingsPage;
