import { useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  loading,
}) {
  const dialogTitle = useMemo(() => title || "Confirm", [title]);
  const dialogMessage = useMemo(
    () => message || "Are you sure you want to continue?",
    [message]
  );
  const confirmText = useMemo(() => confirmLabel || "Confirm", [confirmLabel]);
  const cancelText = useMemo(() => cancelLabel || "Cancel", [cancelLabel]);

  const handleConfirm = useCallback(() => {
    if (onConfirm) onConfirm();
  }, [onConfirm]);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{dialogMessage}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
