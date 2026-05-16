import apiClient from "./apiClient";

export const uploadMaterial = async (offeringId, file, onProgress, { title, description } = {}) => {
  const form = new FormData();
  form.append("OfferingId", offeringId);
  form.append("File", file);
  form.append("Title", title ?? "");
  form.append("Description", description ?? "");

  const res = await apiClient.post("/materials/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data?.data ?? res.data;
};

export const getMaterialDownloadUrl = async (materialId) => {
  const res = await apiClient.get(`/materials/download/${materialId}`);
  const payload = res.data?.data ?? res.data;
  // API returns { signedUrl, expiresInMinutes }
  return { url: payload?.fileUrl ?? payload?.signedUrl ?? payload?.url ?? payload, ...payload };
};

// GET /api/materials/by-offering/{offeringId}
// Response shape: { totalCount, pageNumber, pageSize, items: [...] }
export const getMaterialsByOffering = async (offeringId, { page = 1, pageSize = 50, search } = {}) => {
  const params = { page, pageSize };
  if (search?.trim()) params.search = search.trim();
  const res = await apiClient.get(`/materials/by-offering/${offeringId}`, { params });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : payload?.items ?? payload?.data ?? [];
};

export const getMaterialMetadata = async (materialId) => {
  const res = await apiClient.get(`/materials/${materialId}/metadata`);
  return res.data?.data ?? res.data;
};

export const deleteMaterial = async (materialId) => {
  const res = await apiClient.delete(`/materials/${materialId}`);
  return res.data?.data ?? res.data;
};
