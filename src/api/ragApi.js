import apiClient from "./apiClient";

export const indexMaterial = async (materialId) => {
  const res = await apiClient.post(`/rag/index/${materialId}`);
  return res.data;
};

export const getIndexingStatus = async (materialId) => {
  const res = await apiClient.get(`/rag/status/${materialId}`);
  return res.data;
};

export const ragSearch = async ({ query, subjectOfferingId, materialId } = {}) => {
  const res = await apiClient.post("/rag/search", { query, subjectOfferingId, materialId });
  return res.data;
};

export const ragSearchByOffering = async (offeringId, query, topK = 5) => {
  const res = await apiClient.get(`/rag/search/offering/${offeringId}`, {
    params: { query, topK },
  });
  return res.data;
};

export const deleteRagIndex = async (materialId) => {
  const res = await apiClient.delete(`/rag/index/${materialId}`);
  return res.data;
};
