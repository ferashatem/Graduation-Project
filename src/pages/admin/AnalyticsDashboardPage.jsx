import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
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
} from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import {
  fetchAnalyticsSummary,
  fetchStudentCountByDepartment,
  fetchDoctorWorkload,
  fetchTopEnrolledSubjects,
} from "../../api/analyticsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Analytics Dashboard" }];

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
  const [deptStats, setDeptStats] = useState([]);
  const [doctorWorkload, setDoctorWorkload] = useState([]);
  const [topSubjects, setTopSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <PageHeader title="Analytics Dashboard" breadcrumbs={breadcrumbs} />

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiUserGroup} label="Total Students" value={summary?.totalStudents} color="#2d5be3" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiAcademicCap} label="Total Doctors" value={summary?.totalDoctors} color="#7c3aed" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiBookOpen} label="Offerings" value={summary?.totalOfferings} color="#0891b2" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiClipboardList} label="Enrollments" value={summary?.totalEnrollments} color="#059669" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiLibrary} label="Colleges" value={summary?.totalColleges} color="#d97706" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiCollection} label="Departments" value={summary?.totalDepartments} color="#dc2626" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard icon={HiUsers} label="Batches" value={summary?.totalBatches} color="#0f766e" />
        </Grid>
      </Grid>

      {/* Students by Department */}
      <SectionTitle>Students by Department</SectionTitle>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "slate.50" }}>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>College</strong></TableCell>
              <TableCell align="right"><strong>Students</strong></TableCell>
              <TableCell align="right"><strong>Doctors</strong></TableCell>
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
                <TableCell colSpan={4} align="center">No data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Top Enrolled Subjects */}
      <SectionTitle>Top 10 Enrolled Subjects</SectionTitle>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>Subject</strong></TableCell>
              <TableCell><strong>Code</strong></TableCell>
              <TableCell align="right"><strong>Offerings</strong></TableCell>
              <TableCell align="right"><strong>Enrolled</strong></TableCell>
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
                <TableCell colSpan={5} align="center">No data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Doctor Workload */}
      <SectionTitle>Doctor Workload</SectionTitle>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Doctor</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell align="right"><strong>Offerings</strong></TableCell>
              <TableCell align="right"><strong>Total Students</strong></TableCell>
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
                <TableCell colSpan={4} align="center">No data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default AnalyticsDashboardPage;
