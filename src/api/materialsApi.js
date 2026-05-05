import apiClient from "./apiClient";

export const uploadMaterial = async (offeringId, file, onProgress) => {
  const form = new FormData();
  form.append("OfferingId", offeringId);
  form.append("File", file);

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
  return res.data?.data ?? res.data;
};

export const getMaterialsByOffering = async (offeringId) => {
  const res = await apiClient.get(`/materials`, { params: { offeringId } });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

export const deleteMaterial = async (materialId) => {
  const res = await apiClient.delete(`/materials/${materialId}`);
  return res.data?.data ?? res.data;
};
