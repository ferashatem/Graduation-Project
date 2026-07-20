import { useCallback, useRef, useState } from "react";
import { Box, Typography, alpha } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function ImportDropzone({ file, onFile, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const inputRef = useRef(null);

  const validate = useCallback((f) => {
    if (!f) return "No file selected.";
    if (!f.name.toLowerCase().endsWith(".xlsx"))
      return "Only .xlsx files are supported. Please select a valid Excel file.";
    if (f.size > MAX_SIZE_BYTES)
      return `File size (${(f.size / 1024 / 1024).toFixed(1)}MB) exceeds the ${MAX_SIZE_MB}MB limit.`;
    return "";
  }, []);

  const handleFile = useCallback(
    (f) => {
      const err = validate(f);
      setFileError(err);
      if (!err) onFile(f);
    },
    [onFile, validate]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleInputChange = useCallback(
    (e) => {
      const f = e.target.files[0];
      if (f) handleFile(f);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const borderColor = fileError
    ? "error.main"
    : dragOver
    ? "primary.main"
    : file
    ? "success.main"
    : "divider";

  return (
    <Box>
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        sx={{
          border: "2px dashed",
          borderColor,
          borderRadius: 2,
          p: { xs: 4, sm: 6 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          cursor: disabled ? "default" : "pointer",
          bgcolor: dragOver
            ? (t) => alpha(t.palette.primary.main, 0.04)
            : file
            ? (t) => alpha(t.palette.success.main, 0.04)
            : fileError
            ? (t) => alpha(t.palette.error.main, 0.04)
            : "background.paper",
          transition: "all 0.2s ease",
          outline: "none",
          "&:hover": disabled
            ? {}
            : {
                borderColor: file ? "success.main" : "primary.main",
                bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              },
        }}
      >
        {file ? (
          <>
            <InsertDriveFileIcon sx={{ fontSize: 48, color: "success.main" }} />
            <Typography variant="body1" fontWeight={600} color="success.main">
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
              <Box
                component="span"
                sx={{ color: "primary.main", textDecoration: "underline" }}
              >
                Click to change
              </Box>
            </Typography>
          </>
        ) : (
          <>
            <CloudUploadIcon
              sx={{
                fontSize: 52,
                color: dragOver ? "primary.main" : "text.disabled",
                transition: "color 0.2s",
              }}
            />
            <Typography variant="body1" fontWeight={500}>
              Drag & drop your{" "}
              <Box
                component="code"
                sx={{
                  bgcolor: "action.hover",
                  px: 0.5,
                  borderRadius: 0.5,
                  fontFamily: "monospace",
                }}
              >
                .xlsx
              </Box>{" "}
              file here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or{" "}
              <Box
                component="span"
                sx={{ color: "primary.main", textDecoration: "underline", fontWeight: 500 }}
              >
                Browse File
              </Box>
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
              Max size: {MAX_SIZE_MB}MB · Format: .xlsx only
            </Typography>
          </>
        )}
      </Box>

      {fileError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 0.75, display: "block" }}
        >
          {fileError}
        </Typography>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />
    </Box>
  );
}

export default ImportDropzone;
