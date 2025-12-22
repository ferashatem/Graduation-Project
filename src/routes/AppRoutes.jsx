import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import Home from "../pages/Home";

// Layouts
import MainLayoutAdmin from "../layouts/Admin/MainLayoutAdmin";
import MainLayoutSuperAdmin from "../layouts/Super_Admin/MainLayoutSuperAdmin";
import AdminPage from "../pages/SuperAdmin/AdminPage";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<SignIn />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<MainLayoutAdmin />}>
          <Route path="home" element={<Home />} />
        </Route>

        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<MainLayoutSuperAdmin />}>
          <Route path="home" element={<Home />} />
          <Route path="adminpage" element={<AdminPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;
