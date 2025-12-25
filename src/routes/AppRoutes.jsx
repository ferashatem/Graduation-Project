import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Home from "../pages/Home";
import Unauthorized from "../pages/Unauthorized";

// Layouts
import MainLayoutAdmin from "../layouts/Admin/MainLayoutAdmin";
import MainLayoutSuperAdmin from "../layouts/Super_Admin/MainLayoutSuperAdmin";
import RequireRole from "../auth/RequireRole";
import CreateAdminUser from "../pages/SuperAdmin/CreateAdminUser";

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

        {/* <Route path="/not-allowed" element={<Unauthorized />} /> */}
      </Routes>
    </Router>
  );
}

export default AppRoutes;
