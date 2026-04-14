import { auth } from "../firebase/firebaseConfig";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function RequireSuperAdmin({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    const check = async () => {
      const user = auth.currentUser;
      if (!user) {
        setOk(false);
        return;
      }
      const token = await user.getIdTokenResult();
      setOk(token.claims.role === "super_admin");
    };
    check();
  }, []);

  if (ok === null) return <div>Loading...</div>;
  if (!ok) return <Navigate to="/" replace />;
  return children;
}
