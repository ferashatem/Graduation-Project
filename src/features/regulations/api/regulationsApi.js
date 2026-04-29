import apiClient from "../../../api/apiClient";

// GET /api/regulations
export const fetchAllRegulations = async () => {
  const res = await apiClient.get("/regulations");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// POST /api/regulations  (multipart/form-data: title, content?, type, file?)
export const createRegulation = async ({ title, content, type }) => {
  const form = new FormData();
  form.append("title", title);
  if (content) form.append("content", content);
  form.append("type", type);
  const res = await apiClient.post("/regulations", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// PUT /api/regulations/by-code/{code}  (multipart/form-data)
export const updateRegulation = async (code, { title, content, type, isActive }) => {
  const form = new FormData();
  form.append("title", title);
  if (content) form.append("content", content);
  form.append("type", type);
  form.append("isActive", String(isActive));
  const res = await apiClient.put(`/regulations/by-code/${code}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// DELETE /api/regulations/by-code/{code}
export const deleteRegulation = async (code) => {
  await apiClient.delete(`/regulations/by-code/${code}`);
  return code;
};
