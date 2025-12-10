// src/services/usersService.js
import axios from "axios";

const API_BASE =
  "https://coowned-api-dev-528199941216.us-central1.run.app";

// ----- ID normalizer -----
export const getUserId = (u) => u?.user_id ?? u?.id ?? u?.userId ?? u?.uid ?? null;

// ----- Row mapper used by the table / page -----
export function mapApiUserToRow(u) {
  const id = getUserId(u);
  const name = u?.name ?? u?.fullName ?? "—";
  const email = u?.email ?? "—";
  const phone = u?.phone ?? u?.mobile ?? u?.contactNumber ?? "—";
  const registrationDate = u?.created_at
    ? new Date(u.created_at).toLocaleDateString("en-US")
    : "—";

  return {
    id: String(id ?? crypto.randomUUID()),
    logo: "🟢",
    name,
    email,
    phone,
    registrationDate,
    projects: u?.projectsCount ?? 0,
    sales: u?.totalSales ? `$${u.totalSales}` : "$0",
    _raw: u,
  };
}

// Reusable axios instance (supports abort via signal)
const api = axios.create({ baseURL: API_BASE });

// ----- API: fetch all unshared users -----
export async function fetchUnsharedUsers({ signal } = {}) {
  const resp = await api.get("/api/users/unshared/all", { signal });
  const list = Array.isArray(resp?.data) ? resp.data : [];
  return list;
}

// ----- CSV export helper (optional) -----
export function exportUsersCsv(rows, filenamePrefix = "Leads") {
  const headers = ["Name", "Email", "Contact Number", "Registration Date"];

  const toCsvCell = (val) => {
    const s = String(val ?? "");
    const needsQuote = /[",\n]/.test(s);
    const esc = s.replace(/"/g, '""');
    return needsQuote ? `"${esc}"` : esc;
  };

  const body = rows.map((r) => [r.name, r.email, r.phone, r.registrationDate]);

  const csv = [headers.map(toCsvCell).join(",")]
    .concat(body.map((row) => row.map(toCsvCell).join(",")))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filenamePrefix}_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
