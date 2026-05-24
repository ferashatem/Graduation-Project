import apiClient from "./apiClient";

const norm = (res) => res.data?.data ?? res.data;

// Summarize text or material
export const summarizeText = async ({ text, materialId, language = "en" } = {}) => {
  const res = await apiClient.post("/ai/summarize", { text, materialId, language });
  return norm(res);
};

// Ask a free-form AI question (context-aware)
export const askAi = async ({ question, context, offeringId } = {}) => {
  const res = await apiClient.post("/ai/ask", { question, context, offeringId });
  return norm(res);
};
