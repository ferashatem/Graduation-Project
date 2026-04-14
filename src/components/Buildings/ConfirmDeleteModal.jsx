import { useCallback, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

function ConfirmDeleteModal({
  open,
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
  loading,
}) {
  const dialogTitle = useMemo(() => title || "Delete item", [title]);
  const dialogMessage = useMemo(
    () => message || "Are you sure you want to delete this item?",
    [message]
  );
  const confirmText = useMemo(
    () => confirmLabel || "Delete",
    [confirmLabel]
  );

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
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Deleting..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDeleteModal;

