import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Home from "../pages/Home";
import Unauthorized from "../pages/Unauthorized";

// Layouts
import MainLayoutAdmin from "../layouts/Admin/MainLayoutAdmin";
import MainLayoutSuperAdmin from "../layouts/Super_Admin/MainLayoutSuperAdmin";
import MainLayoutProfessor from "../layouts/Professor/MainLayoutProfessor";
import ProfessorLayout from "../layouts/ProfessorLayout";
import RequireRole from "../auth/RequireRole";
import ProtectedRoute from "../components/common/ProtectedRoute";
import CreateAdminUser from "../pages/SuperAdmin/CreateAdminUser";
import CollegesPage from "../features/colleges/pages/CollegesPage";
import YearsPage from "../features/years/pages/YearsPage";
import DepartmentsPage from "../features/departments/pages/DepartmentsPage";
import DepartmentCoursesPage from "../features/courses/pages/CoursesPage";
import AssignmentsPage from "../pages/admin/AssignmentsPage";
import CreateCourseAssignment from "../pages/admin/CreateCourseAssignment";
import BulkImportUsersPage from "../pages/admin/BulkImportUsersPage";
import BuildingsList from "../pages/admin/BuildingsList";
import BuildingDetails from "../pages/admin/BuildingDetails";
import RoomSchedulePage from "../pages/admin/RoomSchedulePage";
import AdminCourseDetailsPage from "../pages/admin/CourseDetailsPage";
import CoursesPage from "../pages/Courses/CoursesPage";
import CourseDetailsPage from "../pages/Courses/CourseDetailsPage";
import BuildingsPage from "../pages/Buildings/BuildingsPage";
import RoomsPage from "../pages/Buildings/RoomsPage";
import LegacyRoomSchedulePage from "../pages/Buildings/RoomSchedulePage";
import ProfessorHome from "../pages/professor/ProfessorHome";
import ProfessorCoursesPage from "../pages/professor/ProfessorCoursesPage";
import ProfessorCourseDetailsPage from "../pages/professor/ProfessorCourseDetailsPage";
import ProfessorDashboard from "../pages/professor/ProfessorDashboard";
import OfferingsListPage from "../pages/offerings/OfferingsListPage";
import OfferingDashboardPage from "../pages/offerings/OfferingDashboardPage";
import CreateSessionPage from "../pages/offerings/CreateSessionPage";
import SessionDetailsPage from "../pages/sessions/SessionDetailsPage";

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
          <Route path="create-admin" element={<CreateAdminUser />} />
          <Route path="colleges" element={<CollegesPage />} />
          <Route path="colleges/:collegeId/years" element={<YearsPage />} />
          <Route
            path="colleges/:collegeId/years/:yearId/departments"
            element={<DepartmentsPage />}
          />
          <Route
            path="colleges/:collegeId/years/:yearId/departments/:deptId/courses"
            element={<DepartmentCoursesPage />}
          />
          <Route
            path="colleges/:collegeId/years/:yearId/departments/:deptId/courses/:courseId"
            element={<AdminCourseDetailsPage />}
          />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/new" element={<CreateCourseAssignment />} />
          <Route path="bulk-import-users" element={<BulkImportUsersPage />} />
          <Route path="campus-buildings" element={<BuildingsList />} />
          <Route
            path="campus-buildings/:buildingId"
            element={<BuildingDetails />}
          />
          <Route
            path="campus-buildings/:buildingId/floors/:floorId/rooms/:roomId"
            element={<RoomSchedulePage />}
          />
        </Route>

        {/* <Route
          path="/courses"
          element={
            <RequireRole role="admin">
              <MainLayoutAdmin />
            </RequireRole>
          }
        >
          <Route index element={<CoursesPage />} />
          <Route path=":courseId" element={<CourseDetailsPage />} />
        </Route> */}

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
          <Route
            path=":buildingId/rooms/:roomId"
            element={<LegacyRoomSchedulePage />}
          />
        </Route>

        <Route
          path="/offerings"
          element={
            <ProtectedRoute redirectTo="/signin">
              <MainLayoutAdmin />
            </ProtectedRoute>
          }
        >
          <Route index element={<OfferingsListPage />} />
          <Route
            path=":offeringId/dashboard"
            element={<OfferingDashboardPage />}
          />
          <Route
            path=":offeringId/sessions/new"
            element={<CreateSessionPage />}
          />
        </Route>

        <Route
          path="/sessions"
          element={
            <ProtectedRoute redirectTo="/signin">
              <MainLayoutAdmin />
            </ProtectedRoute>
          }
        >
          <Route path=":sessionId" element={<SessionDetailsPage />} />
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
          <Route
            path="courses/:courseDocId"
            element={<ProfessorCourseDetailsPage />}
          />
          <Route
            path="materials"
            element={<Navigate to="/prof/courses" replace />}
          />
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
          <Route
            path="courses/:courseDocId"
            element={<ProfessorCourseDetailsPage />}
          />
          <Route
            path="materials"
            element={<Navigate to="/professor/courses" replace />}
          />
        </Route>

        {/* <Route path="/not-allowed" element={<Unauthorized />} /> */}
      </Routes>
    </Router>
  );
}

export default AppRoutes;
