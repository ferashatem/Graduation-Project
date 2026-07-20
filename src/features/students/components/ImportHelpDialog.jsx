import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const REQUIRED = [
  { name: "FullName", note: "student's full name (3–100 chars)" },
  { name: "NationalId", note: "exactly 14 digits" },
  { name: "Phone", note: "Egyptian number: 010 / 011 / 012 / 015" },
  { name: "BatchCode", note: "must exist in the system" },
  { name: "GroupCode", note: "must belong to the batch" },
];

const OPTIONAL = [
  { name: "Email", note: "personal email, stored for contact" },
  { name: "Governorate", note: "e.g. Cairo, Giza" },
  { name: "Address", note: "free text" },
  { name: "Gender", note: "Male / Female (or ذكر / أنثى)" },
  { name: "DateOfBirth", note: "YYYY-MM-DD format preferred" },
  { name: "StudentType", note: "Regular / Transfer / Repeating / External" },
  { name: "Religion", note: "free text" },
  { name: "CollegeCode", note: "cross-checked against batch (warning if mismatch)" },
  { name: "DepartmentCode", note: "cross-checked against batch (warning if mismatch)" },
];

const STUDENT_TYPES = [
  { value: "Regular / منتظم", meaning: "Standard enrolled student" },
  { value: "Transfer / منقول", meaning: "Transferred from another university" },
  { value: "Repeating / معيد", meaning: "Repeating the academic year" },
  { value: "External / انتساب", meaning: "External / distance student" },
];

function ImportHelpDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>How Student Import Works</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Row 1 must be the header row. Column order doesn't matter — columns are
          detected by name.
        </Typography>

        <Typography variant="subtitle2" gutterBottom>
          Required columns
        </Typography>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {REQUIRED.map((c) => (
            <Stack key={c.name} direction="row" alignItems="center" spacing={1}>
              <Chip
                label="required"
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: 10, height: 20, minWidth: 60 }}
              />
              <Typography variant="body2">
                <strong>{c.name}</strong> — {c.note}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Divider />

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Optional columns
        </Typography>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {OPTIONAL.map((c) => (
            <Stack key={c.name} direction="row" alignItems="center" spacing={1}>
              <Chip
                label="optional"
                size="small"
                variant="outlined"
                sx={{ fontSize: 10, height: 20, minWidth: 60, color: "text.secondary" }}
              />
              <Typography variant="body2">
                <strong>{c.name}</strong> — {c.note}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Divider />

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Auto-generated for every student
        </Typography>
        <Typography variant="body2">
          • University Email → studentid@university.edu
        </Typography>
        <Typography variant="body2">
          • University ID → STU20260001 (incremental)
        </Typography>
        <Typography variant="body2">
          • Temporary Password → shared in the import result
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          StudentType reference
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Value in Excel</strong>
                </TableCell>
                <TableCell>
                  <strong>Meaning</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {STUDENT_TYPES.map((t) => (
                <TableRow key={t.value}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                    {t.value}
                  </TableCell>
                  <TableCell>{t.meaning}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          Bad rows are skipped and never block good rows. Fix the skipped rows
          and re-upload just those rows.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImportHelpDialog;
