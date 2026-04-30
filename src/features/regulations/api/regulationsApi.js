import apiClient from "../../../api/apiClient";

// GET /api/regulations
export const fetchAllRegulations = async () => {
  const res = await apiClient.get("/regulations");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// POST /api/regulations
// Supports: text-only, file-only, or hybrid (text + file)
export const createRegulation = async ({ title, content, type, file }) => {
  const form = new FormData();
  form.append("title", title);
  form.append("type", type);
  if (content) form.append("content", content);
  if (file)    form.append("file", file);

  const res = await apiClient.post("/regulations", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// PUT /api/regulations/by-code/{code}
export const updateRegulation = async (code, { title, content, type, isActive, file }) => {
  const form = new FormData();
  form.append("title", title);
  form.append("type", type);
  form.append("isActive", String(isActive));
  if (content) form.append("content", content);
  if (file)    form.append("file", file);

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
