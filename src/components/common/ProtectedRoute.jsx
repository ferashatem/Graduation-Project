import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useAuthUser } from "../../auth/useAuthUser";
import { db } from "../../firebase/firebaseConfig";
import Loading from "./Loading";
import ErrorState from "./ErrorState";
import { getErrorMessage } from "../../utils/errorHelpers";

function ProtectedRoute({ children, requiredRole, redirectTo = "/signin" }) {
  const { user, authLoading } = useAuthUser();
  const [role, setRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const resolveRole = async () => {
      if (authLoading) return;
      if (!user) {
        if (isActive) {
          setRole("");
          setRoleLoading(false);
        }
        return;
      }

      setRoleLoading(true);
      setError("");

      try {
        const tokenResult = await user.getIdTokenResult();
        let nextRole = tokenResult?.claims?.role || "";

        if (!nextRole) {
          const profileSnap = await getDoc(doc(db, "users", user.uid));
          if (profileSnap.exists()) {
            nextRole = profileSnap.data()?.role || "";
          }
        }

        if (isActive) setRole(String(nextRole || "").toLowerCase());
      } catch (err) {
        if (isActive) setError(getErrorMessage(err, "Unable to verify access."));
      } finally {
        if (isActive) setRoleLoading(false);
      }
    };

    resolveRole();

    return () => {
      isActive = false;
    };
  }, [authLoading, user]);

  if (authLoading || roleLoading) {
    return <Loading label="Checking access..." />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (requiredRole && role !== requiredRole) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-700">
        Not authorized to view this page.
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
