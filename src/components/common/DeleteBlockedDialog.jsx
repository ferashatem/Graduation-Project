import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

/**
 * Shown when the backend rejects a delete with a 400 DomainException
 * e.g. "Cannot delete Batch: 47 student(s) belong to it. Reassign them first."
 */
function DeleteBlockedDialog({ open, message, onManage, onClose }) {
  // Extract counts from the error message
  const studentMatch = message?.match(/(\d+) student\(s\)/);
  const doctorMatch = message?.match(/(\d+) doctor\(s\)/);
  const taMatch = message?.match(/(\d+) TA\(s\)/);

  const studentCount = studentMatch ? parseInt(studentMatch[1]) : null;
  const doctorCount = doctorMatch ? parseInt(doctorMatch[1]) : null;
  const taCount = taMatch ? parseInt(taMatch[1]) : null;

  const entityLabel =
    studentCount != null
      ? "الطلاب"
      : doctorCount != null
      ? "الدكاترة"
      : taCount != null
      ? "المعيدين"
      : "المستخدمين";

  const count = studentCount ?? doctorCount ?? taCount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "warning.main" }}>
        <WarningAmberIcon />
        لا يمكن إتمام الحذف
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          {count != null && (
            <Typography variant="body1" gutterBottom>
              يوجد <strong>{count}</strong> من {entityLabel} مسجلين في هذا العنصر.
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            لا يتم حذف {entityLabel} تلقائياً لحماية بياناتهم.
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>نقل {entityLabel} إلى عنصر آخر</li>
            <li>أو حذف {entityLabel} بشكل منفصل</li>
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {onManage && (
          <Button onClick={onManage} variant="outlined">
            إدارة {entityLabel}
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteBlockedDialog;
