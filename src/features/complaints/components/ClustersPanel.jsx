import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";

function ClustersPanel({ clusters = [] }) {
  if (clusters.length === 0) {
    return (
      <Box className="py-6 text-center text-slate-500">
        No complaint patterns detected.
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {clusters.map((c) => (
        <Grid item xs={12} sm={6} md={4} key={c.id}>
          <Card variant="outlined">
            <CardContent>
              <Box className="flex items-start justify-between gap-2">
                <Typography variant="subtitle2" fontWeight={700}>
                  {c.topic}
                </Typography>
                <Chip
                  label={`${c.complaintCount} complaints`}
                  color={
                    c.complaintCount >= 5
                      ? "error"
                      : c.complaintCount >= 3
                        ? "warning"
                        : "default"
                  }
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {c.aiSummary}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1 }}
              >
                Last updated:{" "}
                {new Date(c.lastUpdated).toLocaleDateString("en-US")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default ClustersPanel;
