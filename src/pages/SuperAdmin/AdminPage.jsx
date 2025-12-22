import React, { useCallback, useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/firebaseConfig";

export default function AdminPage() {
  const createAdminUser = useMemo(
    () => httpsCallable(functions, "createAdminUser"),
    []
  );

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setResult(null);

      try {
        setLoading(true);
        const res = await createAdminUser({
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
        });
        setResult(res.data); // { ok:true, uid }
      } catch (err) {
        // callable functions errors are structured
        setError(err?.message || "Failed to create admin.");
      } finally {
        setLoading(false);
      }
    },
    [createAdminUser, form]
  );

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Create Admin</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input name="fullName" placeholder="Full name" value={form.fullName} onChange={onChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} required />
        <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={onChange} />

        <button disabled={loading}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {result?.uid && <p style={{ color: "green" }}>✅ Admin created: {result.uid}</p>}
    </div>
  );
}
