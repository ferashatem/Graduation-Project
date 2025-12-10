import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

// Pages
import SignIn from "../pages/SignIn";
import MainLayoutAdmin from "../layouts/Admin/MainLayoutAdmin";
import Home from "../pages/Home";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* 🔒 Admin Routes */}
        <Route path="/admin" element={<MainLayoutAdmin />}>
          <Route path="home" element={<Home />} />
        </Route>

        {/* Public */}
        <Route path="/" element={<SignIn />} />
        {/* <Route path="/unauthorized" element={<Unauthorized />} /> */}
      </Routes>
    </Router>
  );
}

export default AppRoutes;
