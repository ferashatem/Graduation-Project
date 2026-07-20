import apiClient from "../../../api/apiClient";

// GET /api/regulations
export const fetchAllRegulations = async () => {
  const res = await apiClient.get("/regulations");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// Type label → integer mapping (matches backend enum)
export const REGULATION_TYPE_OPTIONS = [
  { label: "Academic", value: 0 },
  { label: "Conduct",  value: 1 },
  { label: "Exam",     value: 2 },
  { label: "General",  value: 3 },
];

// POST /api/regulations
export const createRegulation = async ({ title, content, type, file, departmentId, subjectsJson }) => {
  const form = new FormData();
  form.append("title", title);
  form.append("type", type);
  if (content)      form.append("content", content);
  if (file)         form.append("file", file);
  if (departmentId) form.append("departmentId", departmentId);
  if (subjectsJson) form.append("subjectsJson", subjectsJson);

  const res = await apiClient.post("/regulations", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// PUT /api/regulations/by-code/{code}
export const updateRegulation = async (code, { title, content, type, isActive, file, departmentId, subjectsJson }) => {
  const form = new FormData();
  form.append("title", title);
  form.append("type", type);
  form.append("isActive", String(isActive));
  if (content)      form.append("content", content);
  if (file)         form.append("file", file);
  if (departmentId) form.append("departmentId", departmentId);
  if (subjectsJson) form.append("subjectsJson", subjectsJson);

  const res = await apiClient.put(`/regulations/by-code/${code}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

// DELETE /api/regulations/{id}
export const deleteRegulation = async (id) => {
  await apiClient.delete(`/regulations/${id}`);
  return id;
};
