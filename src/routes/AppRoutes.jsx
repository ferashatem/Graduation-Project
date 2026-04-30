
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Home from "../pages/Home";

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
import BuildingsList from "../pages/admin/BuildingsList";
import BuildingDetails from "../pages/admin/BuildingDetails";
import RoomSchedulePage from "../pages/admin/RoomSchedulePage";
import AdminCourseDetailsPage from "../pages/admin/CourseDetailsPage";

// Buildings (legacy)
import BuildingsPage from "../pages/Buildings/BuildingsPage";
import RoomsPage from "../pages/Buildings/RoomsPage";
import LegacyRoomSchedulePage from "../pages/Buildings/RoomSchedulePage";

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

// Chat
import ChatPage from "../features/chat/pages/ChatPage";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

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

          {/* Batches — :deptId (ULID) + :deptCode (public code) */}
          <Route path="departments/:deptId/:deptCode/batches" element={<BatchesPage />} />
          {/* Groups — :batchId (ULID) + :batchCode (public code) */}
          <Route path="batches/:batchId/:batchCode/groups" element={<GroupsPage />} />

          {/* ── Academic ── */}
          <Route path="academic-years/:yearId/semesters" element={<SemestersPage />} />
          {/* Subject offerings nested under a semester */}
          <Route path="semesters/:semesterId/offerings" element={<SubjectOfferingsPage />} />

          {/* ── Subjects ── */}
          <Route path="subjects" element={<SubjectsPage />} />

          {/* ── Students ── */}
          <Route path="students" element={<StudentsPage />} />
          <Route path="register-student" element={<RegisterStudentPage />} />
          <Route path="bulk-import-users" element={<BulkImportUsersPage />} />

          {/* ── Doctors / Staff ── */}
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="register-doctor" element={<RegisterDoctorPage />} />
          <Route path="create-admin" element={<CreateAdminUser />} />

          {/* ── Regulations ── */}
          <Route path="regulations" element={<RegulationsPage />} />

          {/* ── Assignments (legacy) ── */}
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/new" element={<CreateCourseAssignment />} />

          {/* ── Campus ── */}
          <Route path="campus-buildings" element={<BuildingsList />} />
          <Route path="campus-buildings/:buildingId" element={<BuildingDetails />} />
          <Route
            path="campus-buildings/:buildingId/floors/:floorId/rooms/:roomId"
            element={<RoomSchedulePage />}
          />

          {/* ── AI Assistant ── */}
          <Route path="chat" element={<ChatPage />} />
        </Route>

        {/* Legacy buildings routes */}
        <Route
          path="/buildings"
          element={
            <RequireRole role="admin">
              <MainLayoutAdmin />
            </RequireRole>
          }
        >
          <Route index element={<BuildingsPage />} />
          <Route path=":buildingId/rooms" element={<RoomsPage />} />
          <Route path=":buildingId/rooms/:roomId" element={<LegacyRoomSchedulePage />} />
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
          <Route path="quizzes" element={<ProfessorQuizzesPage />} />
          <Route path="quizzes/:quizId/results" element={<ProfessorQuizResultsPage />} />
          <Route path="materials" element={<Navigate to="/prof/courses" replace />} />
          <Route path="chat" element={<ChatPage />} />
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
          <Route path="quizzes" element={<StudentQuizzesPage />} />
          <Route path="quizzes/:quizId" element={<StudentQuizTakePage />} />
          <Route path="quizzes/:quizId/result" element={<StudentQuizResultPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;
