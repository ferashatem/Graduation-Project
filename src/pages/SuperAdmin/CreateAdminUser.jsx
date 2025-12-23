import { useMemo, useState, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function CreateAdmin() {
  const createAdminUser = useMemo(() => {
    const functions = getFunctions();
    return httpsCallable(functions, "createAdminUser");
  }, []);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const res = await createAdminUser({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
        });

        setResult(res.data); // { success, uid, role }
      } catch (err) {
        setError(err?.message || "Failed to create admin.");
      } finally {
        setLoading(false);
      }
    },
    [createAdminUser, form]
  );

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Create Admin</h2>

      <form onSubmit={onSubmit}>
        <input name="fullName" placeholder="Full name" value={form.fullName} onChange={onChange} />
        <input name="email" placeholder="Email" value={form.email} onChange={onChange} />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} />
        <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={onChange} />

        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <pre style={{ background: "#f5f5f5", padding: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
