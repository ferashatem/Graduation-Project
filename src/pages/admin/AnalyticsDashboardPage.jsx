import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  HiAcademicCap,
  HiBookOpen,
  HiLibrary,
  HiUsers,
  HiUserGroup,
  HiCollection,
  HiClipboardList,
  HiTrendingUp,
  HiShieldExclamation,
} from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import {
  fetchAnalyticsSummary,
  fetchStudentCountByDepartment,
  fetchDoctorWorkload,
  fetchTopEnrolledSubjects,
  fetchAdminDashboard,
  fetchAtRiskStudents,
  fetchDepartmentComparison,
  triggerRiskAnalysis,
} from "../../api/analyticsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

function StatCard({ icon: Icon, label, value, color = "#2d5be3" }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ color, fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {value ?? "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
      {children}
    </Typography>
  );
}

function AnalyticsDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [adminDash, setAdminDash] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [doctorWorkload, setDoctorWorkload] = useState([]);
  const [topSubjects, setTopSubjects] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [deptComparison, setDeptComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskTriggering, setRiskTriggering] = useState(false);
  const [riskSnack, setRiskSnack] = useState("");
  const { t } = useTranslation();
  const breadcrumbs = [{ label: t("analytics.title") }];

  const handleTriggerRisk = async () => {
    setRiskTriggering(true);
    try {
      await triggerRiskAnalysis();
      setRiskSnack("Risk analysis triggered successfully. Results will update within a few minutes.");
    } catch {
      setRiskSnack("Failed to trigger risk analysis. Please try again.");
    } finally {
      setRiskTriggering(false);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [sum, depts, doctors, subjects] = await Promise.all([
          fetchAnalyticsSummary(),
          fetchStudentCountByDepartment(),
          fetchDoctorWorkload(),
          fetchTopEnrolledSubjects(10),
        ]);
        setSummary(sum);
        setDeptStats(depts);
        setDoctorWorkload(doctors);
        setTopSubjects(subjects);
        // Secondary data — load in background, don't block initial render
        fetchAdminDashboard().then(setAdminDash).catch(() => {});
        fetchAtRiskStudents().then(setAtRisk).catch(() => {});
        fetchDepartmentComparison().then(setDeptComparison).catch(() => {});
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Box className="flex items-center justify-center py-24">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("analytics.title")}
        breadcrumbs={breadcrumbs}
        action={
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<HiShieldExclamation />}
            disabled={riskTriggering}
            onClick={handleTriggerRisk}
          >
            {riskTriggering ? "Triggering…" : "Trigger Risk Analysis"}
          </Button>
        }
      />
      <Snackbar
        open={Boolean(riskSnack)}
        autoHideDuration={5000}
        onClose={() => setRiskSnack("")}
        message={riskSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiUserGroup} label={t("analytics.totalStudents")} value={summary?.totalStudents} color="#2d5be3" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiAcademicCap} label={t("analytics.totalDoctors")} value={summary?.totalDoctors} color="#7c3aed" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiBookOpen} label={t("analytics.offerings")} value={summary?.totalOfferings} color="#0891b2" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiClipboardList} label={t("analytics.enrollments")} value={summary?.totalEnrollments} color="#059669" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiLibrary} label={t("analytics.colleges")} value={summary?.totalColleges} color="#d97706" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiCollection} label={t("analytics.departments")} value={summary?.totalDepartments} color="#dc2626" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiUsers} label={t("analytics.batches")} value={summary?.totalBatches} color="#0f766e" />
        </Grid>
        {adminDash && (
          <>
            <Grid item xs={6} sm={4} md={3}>
              <StatCard icon={HiTrendingUp} label={t("analytics.avgGpa")} value={adminDash.avgGpa} color="#7c3aed" />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <StatCard icon={HiShieldExclamation} label={t("analytics.atRiskStudents")} value={adminDash.atRiskCount} color="#dc2626" />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <StatCard icon={HiAcademicCap} label={t("analytics.passRate")} value={adminDash.passRate != null ? `${adminDash.passRate}%` : null} color="#059669" />
            </Grid>
          </>
        )}
      </Grid>

      {/* Students by Department */}
      <SectionTitle>{t("analytics.studentsByDepartment")}</SectionTitle>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "slate.50" }}>
              <TableCell><strong>{t("analytics.department")}</strong></TableCell>
              <TableCell><strong>{t("analytics.college")}</strong></TableCell>
              <TableCell align="right"><strong>{t("analytics.students")}</strong></TableCell>
              <TableCell align="right"><strong>{t("analytics.doctors")}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deptStats.map((row) => (
              <TableRow key={row.departmentId} hover>
                <TableCell>{row.departmentName}</TableCell>
                <TableCell>
                  <Chip label={row.collegeName} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <strong>{row.studentCount}</strong>
                </TableCell>
                <TableCell align="right">{row.doctorCount}</TableCell>
              </TableRow>
            ))}
            {deptStats.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">{t("analytics.noData")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Top Enrolled Subjects */}
      <SectionTitle>{t("analytics.topEnrolledSubjects")}</SectionTitle>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>{t("analytics.subject")}</strong></TableCell>
              <TableCell><strong>{t("analytics.code")}</strong></TableCell>
              <TableCell align="right"><strong>{t("analytics.offerings")}</strong></TableCell>
              <TableCell align="right"><strong>{t("analytics.enrolled")}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topSubjects.map((row, i) => (
              <TableRow key={row.subjectId} hover>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{row.subjectName}</TableCell>
                <TableCell>
                  <Chip label={row.subjectCode} size="small" />
                </TableCell>
                <TableCell align="right">{row.offeringCount}</TableCell>
                <TableCell align="right"><strong>{row.enrolledCount}</strong></TableCell>
              </TableRow>
            ))}
            {topSubjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">{t("analytics.noData")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Doctor Workload */}
      <SectionTitle>{t("analytics.doctorWorkload")}</SectionTitle>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>{t("analytics.doctor")}</strong></TableCell>
              <TableCell><strong>{t("analytics.department")}</strong></TableCell>
              <TableCell align="right"><strong>{t("analytics.offerings")}</strong></TableCell>
              <TableCell align="right"><strong>{t("analytics.totalStudentsCol")}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctorWorkload.map((row) => (
              <TableRow key={row.doctorId} hover>
                <TableCell>{row.fullName}</TableCell>
                <TableCell>
                  <Chip label={row.departmentName} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">{row.offeringCount}</TableCell>
                <TableCell align="right"><strong>{row.totalStudents}</strong></TableCell>
              </TableRow>
            ))}
            {doctorWorkload.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">{t("analytics.noData")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Department Comparison */}
      {deptComparison.length > 0 && (
        <>
          <SectionTitle>{t("analytics.deptComparison")}</SectionTitle>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>{t("analytics.department")}</strong></TableCell>
                  <TableCell align="right"><strong>{t("analytics.avgGpa")}</strong></TableCell>
                  <TableCell align="right"><strong>{t("analytics.passRate")}</strong></TableCell>
                  <TableCell align="right"><strong>{t("analytics.students")}</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deptComparison.map((row) => (
                  <TableRow key={row.departmentName} hover>
                    <TableCell>{row.departmentName}</TableCell>
                    <TableCell align="right">
                      <strong style={{ color: row.avgGpa >= 2.0 ? "#059669" : "#dc2626" }}>
                        {row.avgGpa}
                      </strong>
                    </TableCell>
                    <TableCell align="right">{row.passRate}%</TableCell>
                    <TableCell align="right">{row.studentCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* At-Risk Students */}
      {atRisk.length > 0 && (
        <>
          <SectionTitle>{t("analytics.atRiskStudents")}</SectionTitle>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>{t("analytics.students")}</strong></TableCell>
                  <TableCell><strong>{t("analytics.department")}</strong></TableCell>
                  <TableCell align="right"><strong>{t("analytics.gpa")}</strong></TableCell>
                  <TableCell align="right"><strong>{t("analytics.failing")}</strong></TableCell>
                  <TableCell><strong>{t("analytics.risk")}</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {atRisk.map((row) => (
                  <TableRow key={row.studentId} hover>
                    <TableCell>
                      <Typography variant="body2">{row.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.studentCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.departmentName || "—"} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{row.gpa ?? "—"}</TableCell>
                    <TableCell align="right">{row.failingSubjects}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.riskLevel === "High" ? t("analytics.riskHigh") : t("analytics.riskMedium")}
                        size="small"
                        color={row.riskLevel === "High" ? "error" : "warning"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
}

export default AnalyticsDashboardPage;
