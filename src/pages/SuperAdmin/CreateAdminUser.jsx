import React, { useCallback, useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "../../firebase/firebaseConfig";
import { useAuthUser } from "../../auth/useAuthUser";

export default function CreateAdminUser() {
  const { user, authLoading } = useAuthUser();

  const createAdminUser = useMemo(() => {
    return httpsCallable(functions, "createAdminUser");
  }, []);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setResult(null);

      // still loading auth state
      if (authLoading) return;

      // not logged in
      if (!user || !auth.currentUser) {
        setError("Login first.");
        return;
      }

      setLoading(true);
      try {
        // IMPORTANT: refresh token so role claims are up-to-date
        await auth.currentUser.getIdToken(true);

        // Call the callable function (this sends auth token automatically)
        const res = await createAdminUser({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim()
        });

        setResult(res.data); // { success, uid, role }
        setForm({ fullName: "", email: "", password: "", phone: "" });
      } catch (err) {
        // firebase callable error
        const msg =
          err?.message ||
          err?.details ||
          "Failed to create admin user.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [authLoading, user, createAdminUser, form]
  );

  return (
    <div style={{ maxWidth: 520, padding: 16 }}>
      <h2>Create Admin</h2>

      {authLoading ? (
        <p>Loading auth...</p>
      ) : (
        <p style={{ color: "#6b7280" }}>
          Logged in as: {user?.email || "Not logged in"}
        </p>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          name="fullName"
          placeholder="Full name"
          value={form.fullName}
          onChange={onChange}
          required
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={onChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={onChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      {result && (
        <pre style={{ marginTop: 12, background: "#f5f5f5", padding: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
