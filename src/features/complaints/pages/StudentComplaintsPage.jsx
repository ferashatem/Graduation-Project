import { useCallback, useMemo, useState } from "react";
import { Alert, Button } from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import ComplaintFormDialog from "../components/ComplaintFormDialog";
import ComplaintsTable from "../components/ComplaintsTable";
import { useStudentComplaints } from "../hooks/useComplaints";

function StudentComplaintsPage() {
  const { complaints, loading, error, reload, submitComplaint } = useStudentComplaints();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const breadcrumbs = useMemo(() => [{ label: "My Complaints" }], []);

  const handleSubmit = useCallback(async (dto) => {
    setSubmitError("");
    const result = await submitComplaint(dto);
    if (result.ok) {
      setDialogOpen(false);
      setSuccessMsg("Complaint submitted. AI analysis will be available within a few seconds.");
      setTimeout(() => setSuccessMsg(""), 6000);
    } else {
      setSubmitError(result.error);
    }
  }, [submitComplaint]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Complaints"
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="contained" onClick={() => { setSubmitError(""); setDialogOpen(true); }}>
            New Complaint
          </Button>
        }
      />

      {successMsg ? <Alert severity="success">{successMsg}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}

      {loading && complaints.length === 0 ? (
        <Loading label="Loading complaints…" />
      ) : (
        <ComplaintsTable rows={complaints} loading={loading} showStudent={false} />
      )}

      <ComplaintFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        error={submitError}
      />
    </div>
  );
}

export default StudentComplaintsPage;
