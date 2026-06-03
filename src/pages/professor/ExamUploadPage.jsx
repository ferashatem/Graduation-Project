import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { uploadExamPdf } from "../../api/examsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const BREADCRUMBS = [{ label: "Exam Upload" }];

function ExamUploadPage() {
  const { offeringId: paramOfferingId } = useParams();
  const [searchParams] = useSearchParams();
  const offeringId = paramOfferingId || searchParams.get("offeringId") || "";

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError("");
    }
    e.target.value = "";
  };

  const handleUpload = useCallback(async () => {
    if (!file || !offeringId) return;
    setBusy(true);
    setError("");
    setResult(null);
    setProgress(0);
    try {
      const data = await uploadExamPdf(offeringId, file, setProgress);
      setResult(data);
      setFile(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, [file, offeringId]);

  return (
    <div className="space-y-5">
      <PageHeader title="Upload Exam PDF" breadcrumbs={BREADCRUMBS} />

      {!offeringId && (
        <Alert severity="warning">No offering ID provided. Navigate here from a course offering page.</Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 560 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Upload a PDF exam file for the selected subject offering. Only PDF files are accepted.
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" component="label" disabled={busy || !offeringId}>
            {file ? "Change File" : "Select PDF"}
            <input type="file" accept=".pdf,application/pdf" hidden onChange={handleFileChange} />
          </Button>

          {file && (
            <Box className="mt-2 flex items-center gap-2">
              <Chip label={file.name} size="small" onDelete={() => setFile(null)} />
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          )}
        </Box>

        {busy && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">{progress}%</Typography>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={busy || !file || !offeringId}
          >
            {busy ? "Uploading…" : "Upload Exam"}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {result && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Exam uploaded successfully!
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Code: <strong>{result.code}</strong></li>
              <li>Title: {result.title}</li>
              <li>Status: {result.status}</li>
            </Box>
          </Alert>
        )}
      </Paper>
    </div>
  );
}

export default ExamUploadPage;
