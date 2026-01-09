import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Home from "../pages/Home";
import Unauthorized from "../pages/Unauthorized";

// Layouts
import MainLayoutAdmin from "../layouts/Admin/MainLayoutAdmin";
import MainLayoutSuperAdmin from "../layouts/Super_Admin/MainLayoutSuperAdmin";
import MainLayoutProfessor from "../layouts/Professor/MainLayoutProfessor";
import RequireRole from "../auth/RequireRole";
import CreateAdminUser from "../pages/SuperAdmin/CreateAdminUser";
import CollegesPage from "../features/colleges/pages/CollegesPage";
import YearsPage from "../features/years/pages/YearsPage";
import DepartmentsPage from "../features/departments/pages/DepartmentsPage";
import DepartmentCoursesPage from "../features/courses/pages/CoursesPage";
import AssignmentsPage from "../pages/admin/AssignmentsPage";
import CreateCourseAssignment from "../pages/admin/CreateCourseAssignment";
import CoursesPage from "../pages/Courses/CoursesPage";
import CourseDetailsPage from "../pages/Courses/CourseDetailsPage";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<SignIn />} />
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
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/new" element={<CreateCourseAssignment />} />
        </Route>

        <Route
          path="/courses"
          element={
            <RequireRole role="admin">
              <MainLayoutAdmin />
            </RequireRole>
          }
        >
          <Route index element={<CoursesPage />} />
          <Route path=":courseId" element={<CourseDetailsPage />} />
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
        </Route>

        {/* Professor Routes */}
        <Route
          path="/professor"
          element={
            <RequireRole role="professor">
              <MainLayoutProfessor />
            </RequireRole>
          }
        >
          <Route path="home" element={<Home />} />
        </Route>

        {/* <Route path="/not-allowed" element={<Unauthorized />} /> */}
      </Routes>
    </Router>
  );
}

export default AppRoutes;
