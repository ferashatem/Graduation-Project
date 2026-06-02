import React from "react";
import ReactDOM from "react-dom/client";
import "../src/assets/styles/index.css";
import "./i18n/config";
import App from "./App";
import I18nProvider from "./i18n/I18nProvider";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
