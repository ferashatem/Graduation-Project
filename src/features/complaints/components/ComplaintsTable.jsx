import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";

const STATUS_COLOR = {
  Pending: "warning",
  UnderReview: "info",
  Resolved: "success",
  Dismissed: "default",
};
const PRIORITY_COLOR = {
  Normal: "default",
  High: "warning",
  Critical: "error",
};

function AnalysisRow({ analysis }) {
  if (!analysis)
    return (
      <Typography variant="body2" color="text.secondary">
        Analysis pending…
      </Typography>
    );
  return (
    <Box className="grid gap-1 text-sm">
      <Box>
        <strong>Category:</strong> {analysis.category}
      </Box>
      <Box>
        <strong>Severity:</strong> {analysis.severity}
      </Box>
      <Box>
        <strong>Sentiment:</strong> {analysis.sentimentScore?.toFixed(2)}
      </Box>
      {analysis.aiSummary && (
        <Box>
          <strong>AI Summary:</strong> {analysis.aiSummary}
        </Box>
      )}
      {analysis.suggestedAction && (
        <Box>
          <strong>Suggested Action:</strong> {analysis.suggestedAction}
        </Box>
      )}
    </Box>
  );
}

function ComplaintRow({ row, showStudent, onReply }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const colSpan = showStudent ? 8 : 7;

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setExpanded((p) => !p)}>
            {expanded ? <HiChevronUp /> : <HiChevronDown />}
          </IconButton>
        </TableCell>
        {showStudent && (
          <TableCell>
            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
            >
              {row.student?.fullName ??
                (row.studentId === "HIDDEN" ? "Anonymous" : row.studentId)}
            </Typography>
          </TableCell>
        )}
        <TableCell>{row.title}</TableCell>
        <TableCell>{row.targetType}</TableCell>
        <TableCell>
          <Chip
            label={row.status}
            color={STATUS_COLOR[row.status] ?? "default"}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={row.priority}
            color={PRIORITY_COLOR[row.priority] ?? "default"}
            size="small"
          />
        </TableCell>
        <TableCell>
          {new Date(row.createdAt).toLocaleDateString("en-US")}
        </TableCell>
        {onReply && (
          <TableCell>
            {row.status !== "Resolved" && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onReply(row)}
              >
                {t("complaints.submitResponse")}
              </Button>
            )}
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell colSpan={colSpan} sx={{ py: 0 }}>
          <Collapse in={expanded} unmountOnExit>
            <Box sx={{ py: 2, px: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Message:</strong> {row.message}
              </Typography>
              {row.status === "Resolved" && row.resolutionNote && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "success.50",
                    border: "1px solid",
                    borderColor: "success.200",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="success.dark"
                    gutterBottom
                  >
                    Doctor's Reply
                  </Typography>
                  <Typography variant="body2">{row.resolutionNote}</Typography>
                  {row.resolvedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(row.resolvedAt).toLocaleString("en-US")}
                    </Typography>
                  )}
                </Box>
              )}
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  AI Analysis
                </Typography>
                <AnalysisRow analysis={row.analysis} />
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function ComplaintsTable({ rows = [], loading, showStudent = false, onReply }) {
  const { t } = useTranslation();
  if (!loading && rows.length === 0) {
    return (
      <Box className="py-12 text-center text-slate-500">
        {t("complaints.noComplaints")}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={48} />
            {showStudent && <TableCell>{t("complaints.student")}</TableCell>}
            <TableCell>{t("complaints.titleCol")}</TableCell>
            <TableCell>{t("complaints.type")}</TableCell>
            <TableCell>{t("complaints.status")}</TableCell>
            <TableCell>{t("complaints.priority")}</TableCell>
            <TableCell>{t("complaints.date")}</TableCell>
            {onReply && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <ComplaintRow
              key={row.id}
              row={row}
              showStudent={showStudent}
              onReply={onReply}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ComplaintsTable;
