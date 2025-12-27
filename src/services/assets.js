import { http } from "./http";

// Shape: API returns { data: [...] } or bare array; normalize to []
function normalizeList(res) {
  const d = res?.data?.data ?? res?.data;
  return Array.isArray(d) ? d : [];
}
function normalizeOne(res) {
  return res?.data?.data ?? res?.data;
}

// ---- Get asset Request ----
async function getAll({ signal } = {}) {
  const res = await http.get("/assets", { signal });
  return normalizeList(res);
}

// ---- Get asset Request By ID ----
async function getById(assets_id, { signal } = {}) {
  const res = await http.get(`/assets/${assets_id}`, { signal });
  return normalizeOne(res);
}

// ---- Post asset Request ----
async function create(payload, { signal } = {}) {
  // payload = { asset: {...}, images: [...] }
  const res = await http.post("/assets", payload, { signal });
  return normalizeOne(res);
}

// ---- Put asset Request ----
async function update(assets_id, updates, { signal } = {}) {
  // updates = { asset: {...}, images?: [...] } (match your backend)
  const res = await http.put(`/assets/${assets_id}`, updates, { signal });
  return normalizeOne(res);
}

// ---- Delete asset Request ----
async function remove(asset_id, user_id, { signal } = {}) {
  await http.delete(`/assets/${user_id}/${asset_id}`, { signal });
  return true;
}

// ---- Publish/Unpublish asset ----
async function setPublished({ asset_id, published, updated_by, signal } = {}) {
  // If your backend path differs, adjust this to match it.
  // Body matches what you shared in your example.
  const res = await http.put(
    "/assets/publish",
    { asset_id, published, updated_by },
    { signal }
  );
  return normalizeOne(res);
}

// ---- Helper to build create payload from your form ----
function buildCreatePayload(form) {
  const toNum = (v) => (v === "" || v == null ? 0 : Number(v));
  const price = toNum(form.price);
  const shares = toNum(form.shares);
  const price_per_share = shares > 0 ? +(price / shares).toFixed(2) : 0;

  return {
    asset: {
      type: "22f4a1b0-2c11-4af8-9a22-91a5c2e55555",
      title_en: form.title_en,
      title_ar: form.title_ar,
      overview_en: form.overview_en,
      overview_ar: form.overview_ar,
      price,
      price_per_share,
      shares,
      roi: toNum(form.roi),
      beds: toNum(form.beds),
      baths: toNum(form.baths),
      area: toNum(form.area),
      unit_code: toNum(form.unit_code),
      status: "bcee91b7-0efa-494b-aa87-d8397bdedaa7",
      created_by: "03dc52ff-e1f6-4b96-8f3b-4e4b8fc93e29",
    },
    images: [{ url: "https://example.com/image1.jpg", title: "Living Room" }],
  };
}

export const assetsService = {
  getAll,
  getById,
  create,
  update,
  remove,
  setPublished,
  buildCreatePayload,
};
