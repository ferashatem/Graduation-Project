
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Home from "../pages/Home";
import ForceChangePassword from "../pages/ForceChangePassword";

// Layouts
import MainLayoutAdmin from "../layouts/Admin/MainLayoutAdmin";
import MainLayoutSuperAdmin from "../layouts/Super_Admin/MainLayoutSuperAdmin";
import MainLayoutProfessor from "../layouts/Professor/MainLayoutProfessor";
import ProfessorLayout from "../layouts/ProfessorLayout";
import RequireRole from "../auth/RequireRole";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Admin — Structure
import CreateAdminUser from "../pages/SuperAdmin/CreateAdminUser";
import CollegesPage from "../features/colleges/pages/CollegesPage";
import YearsPage from "../features/years/pages/YearsPage";
import DepartmentsPage from "../features/departments/pages/DepartmentsPage";
import BatchesPage from "../features/batches/pages/BatchesPage";
import GroupsPage from "../features/groups/pages/GroupsPage";

// Admin — Academic
import SemestersPage from "../features/semesters/pages/SemestersPage";

// Admin — Subjects & Offerings
import DepartmentCoursesPage from "../features/courses/pages/CoursesPage";
import SubjectsPage from "../pages/admin/SubjectsPage";
import SubjectOfferingsPage from "../pages/admin/SubjectOfferingsPage";

// Admin — Students & Doctors
import StudentsPage from "../pages/admin/StudentsPage";
import DoctorsPage from "../pages/admin/DoctorsPage";
import RegisterStudentPage from "../pages/admin/RegisterStudentPage";
import RegisterDoctorPage from "../pages/admin/RegisterDoctorPage";
import BulkImportUsersPage from "../pages/admin/BulkImportUsersPage";

// Admin — Misc
import RegulationsPage from "../pages/admin/RegulationsPage";
import AssignmentsPage from "../pages/admin/AssignmentsPage";
import CreateCourseAssignment from "../pages/admin/CreateCourseAssignment";
import AdminCourseDetailsPage from "../pages/admin/CourseDetailsPage";

// Professor
import ProfessorHome from "../pages/professor/ProfessorHome";
import ProfessorCoursesPage from "../pages/professor/ProfessorCoursesPage";
import ProfessorCourseDetailsPage from "../pages/professor/ProfessorCourseDetailsPage";
import ProfessorDashboard from "../pages/professor/ProfessorDashboard";
import ProfessorQuizzesPage from "../pages/professor/ProfessorQuizzesPage";
import ProfessorQuizResultsPage from "../pages/professor/ProfessorQuizResultsPage";

// Assistant
import AssistantLayout from "../layouts/AssistantLayout";
import AssistantHome from "../pages/assistant/AssistantHome";
import AssistantCoursesPage from "../pages/assistant/AssistantCoursesPage";

// Student
import StudentLayout from "../layouts/StudentLayout";
import StudentHome from "../pages/student/StudentHome";
import StudentCoursesPage from "../pages/student/StudentCoursesPage";
import StudentQuizzesPage from "../pages/student/StudentQuizzesPage";
import StudentQuizTakePage from "../pages/student/StudentQuizTakePage";
import StudentQuizResultPage from "../pages/student/StudentQuizResultPage";
import StudentGradesPage from "../pages/student/StudentGradesPage";
import StudentAttendancePage from "../pages/student/StudentAttendancePage";
import StudentAcademicStatusPage from "../pages/student/StudentAcademicStatusPage";
import StudentRoadmapPage from "../pages/student/StudentRoadmapPage";

// Schedule
import StudentSchedulePage from "../pages/student/StudentSchedulePage";
import ProfessorSchedulePage from "../pages/professor/ProfessorSchedulePage";
import AdminSchedulePage from "../pages/admin/AdminSchedulePage";

// Chat
import ChatPage from "../features/chat/pages/ChatPage";

// Complaints
import StudentComplaintsPage from "../features/complaints/pages/StudentComplaintsPage";
import DoctorReportsPage from "../features/complaints/pages/DoctorReportsPage";
import AdminComplaintsPage from "../features/complaints/pages/AdminComplaintsPage";

// Academic Bulk Import & Exam Upload
import AcademicBulkImportPage from "../pages/admin/AcademicBulkImportPage";
import AnalyticsDashboardPage from "../pages/admin/AnalyticsDashboardPage";
import NotificationsPage from "../pages/admin/NotificationsPage";
import AdminsManagementPage from "../pages/admin/AdminsManagementPage";
import AuditLogsPage from "../pages/admin/AuditLogsPage";
import ExamUploadPage from "../pages/professor/ExamUploadPage";
import AdminEnrollmentsPage from "../pages/admin/AdminEnrollmentsPage";
import ProfessorExamsPage from "../pages/professor/ProfessorExamsPage";
import ProfessorExamResultsPage from "../pages/professor/ProfessorExamResultsPage";
import ProfessorAttendancePage from "../pages/professor/ProfessorAttendancePage";
import ProfessorExamAnalyticsPage from "../pages/professor/ProfessorExamAnalyticsPage";
import ProfessorAssignmentsPage from "../pages/professor/ProfessorAssignmentsPage";
import ProfessorGradesImportPage from "../pages/professor/ProfessorGradesImportPage";
import TeachingIntelligencePage from "../pages/professor/TeachingIntelligencePage";
import ProfessorCompanionPage from "../pages/professor/ProfessorCompanionPage";
import ProfessorNotificationsPage from "../pages/professor/ProfessorNotificationsPage";
import StudentAssignmentsPage from "../pages/student/StudentAssignmentsPage";
import StudentNotificationsPage from "../pages/student/StudentNotificationsPage";
import StudentCompanionPage from "../pages/student/StudentCompanionPage";
import ImportStudentsPage from "../features/students/pages/ImportStudentsPage";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/change-password" element={<ForceChangePassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <MainLayoutAdmin />
            </RequireRole>
          }
        >
          <Route path="home" element={<Home />} />

          {/* ── Structure ── */}
          <Route path="colleges" element={<CollegesPage />} />
          <Route path="colleges/:collegeId/years" element={<YearsPage />} />
          <Route path="colleges/:collegeId/years/:yearId/departments" element={<DepartmentsPage />} />
          <Route path="colleges/:collegeId/:collegeCode/departments" element={<DepartmentsPage />} />
          <Route
            path="colleges/:collegeId/years/:yearId/departments/:deptId/courses"
            element={<DepartmentCoursesPage />}
          />
          <Route
            path="colleges/:collegeId/years/:yearId/departments/:deptId/courses/:courseId"
            element={<AdminCourseDetailsPage />}
          />

          {/* Batches & Groups */}
          <Route path="departments/:deptId/:deptCode/batches" element={<BatchesPage />} />
          <Route path="batches/:batchId/:batchCode/groups" element={<GroupsPage />} />

          {/* ── Academic ── */}
          <Route path="academic-years/:yearId/semesters" element={<SemestersPage />} />
          <Route path="semesters/:semesterId/offerings" element={<SubjectOfferingsPage />} />

          {/* ── Subjects ── */}
          <Route path="subjects" element={<SubjectsPage />} />

          {/* ── Students ── */}
          <Route path="students" element={<StudentsPage />} />
          <Route path="register-student" element={<RegisterStudentPage />} />
          <Route path="import-students" element={<ImportStudentsPage />} />
          <Route path="bulk-import-users" element={<BulkImportUsersPage />} />

          {/* ── Doctors / Staff ── */}
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="register-doctor" element={<Navigate to="/admin/doctors" replace />} />
          <Route path="create-admin" element={<Navigate to="/admin/admins" replace />} />

          {/* ── Regulations ── */}
          <Route path="regulations" element={<RegulationsPage />} />

          {/* ── Assignments (legacy) ── */}
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/new" element={<CreateCourseAssignment />} />


          {/* ── Schedule ── */}
          <Route path="schedule" element={<AdminSchedulePage />} />

          {/* ── Complaints ── */}
          <Route path="complaints" element={<AdminComplaintsPage />} />

          {/* ── Academic Bulk Import ── */}
          <Route path="academic-import" element={<AcademicBulkImportPage />} />

          {/* ── Analytics ── */}
          <Route path="analytics" element={<AnalyticsDashboardPage />} />

          {/* ── Admins Management ── */}
          <Route path="admins" element={<AdminsManagementPage />} />

          {/* ── Audit Logs ── */}
          <Route path="audit-logs" element={<AuditLogsPage />} />

          {/* ── Enrollments ── */}
          <Route path="enrollments" element={<AdminEnrollmentsPage />} />

          {/* ── Notifications ── */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* ── AI Assistant ── */}
          <Route path="chat" element={<ChatPage />} />
          <Route path="change-password" element={<ForceChangePassword />} />
        </Route>

        {/* Super Admin Routes */}
        <Route
          path="/super_admin"
          element={
            <RequireRole role="super_admin">
              <MainLayoutSuperAdmin />
            </RequireRole>
          }
        >
          <Route path="home" element={<Home />} />
          <Route
            path="create-admin"
            element={
              <RequireRole role="super_admin">
                <CreateAdminUser />
              </RequireRole>
            }
          />
          <Route path="bulk-import-users" element={<BulkImportUsersPage />} />
        </Route>

        {/* Professor Routes */}
        <Route
          path="/prof"
          element={
            <ProtectedRoute requiredRole="professor" redirectTo="/signin">
              <ProfessorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfessorHome />} />
          <Route path="dashboard" element={<ProfessorDashboard />} />
          <Route path="courses" element={<ProfessorCoursesPage />} />
          <Route path="courses/:courseDocId" element={<ProfessorCourseDetailsPage />} />
          <Route path="schedule" element={<ProfessorSchedulePage />} />
          <Route path="quizzes" element={<ProfessorQuizzesPage />} />
          <Route path="quizzes/:quizId/results" element={<ProfessorQuizResultsPage />} />
          <Route path="materials" element={<Navigate to="/prof/courses" replace />} />
          <Route path="complaints" element={<DoctorReportsPage />} />
          <Route path="exam-upload" element={<ExamUploadPage />} />
          <Route path="exam-upload/:offeringId" element={<ExamUploadPage />} />
          <Route path="exams" element={<ProfessorExamsPage />} />
          <Route path="exams/:examId/results" element={<ProfessorExamResultsPage />} />
          <Route path="exams/:examId/analytics" element={<ProfessorExamAnalyticsPage />} />
          <Route path="attendance" element={<ProfessorAttendancePage />} />
          <Route path="assignments" element={<ProfessorAssignmentsPage />} />
          <Route path="grades-import" element={<ProfessorGradesImportPage />} />
          <Route path="teaching-intelligence" element={<TeachingIntelligencePage />} />
          <Route path="companion" element={<ProfessorCompanionPage />} />
          <Route path="notifications" element={<ProfessorNotificationsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="change-password" element={<ForceChangePassword />} />
        </Route>

        <Route
          path="/professor"
          element={
            <RequireRole role="professor">
              <MainLayoutProfessor />
            </RequireRole>
          }
        >
          <Route path="home" element={<Home />} />
          <Route path="dashboard" element={<ProfessorDashboard />} />
          <Route path="courses" element={<ProfessorCoursesPage />} />
          <Route path="courses/:courseDocId" element={<ProfessorCourseDetailsPage />} />
          <Route path="materials" element={<Navigate to="/professor/courses" replace />} />
        </Route>

        {/* Assistant Routes */}
        <Route
          path="/asst"
          element={
            <ProtectedRoute requiredRole="assistant" redirectTo="/signin">
              <AssistantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AssistantHome />} />
          <Route path="courses" element={<AssistantCoursesPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="change-password" element={<ForceChangePassword />} />
        </Route>

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student" redirectTo="/signin">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentHome />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="schedule" element={<StudentSchedulePage />} />
          <Route path="quizzes" element={<StudentQuizzesPage />} />
          <Route path="quizzes/:quizId" element={<StudentQuizTakePage />} />
          <Route path="quizzes/:quizId/result" element={<StudentQuizResultPage />} />
          <Route path="grades" element={<StudentGradesPage />} />
          <Route path="attendance" element={<StudentAttendancePage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="academic-status" element={<StudentAcademicStatusPage />} />
          <Route path="roadmap" element={<StudentRoadmapPage />} />
          <Route path="complaints" element={<StudentComplaintsPage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="companion" element={<StudentCompanionPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="change-password" element={<ForceChangePassword />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;
