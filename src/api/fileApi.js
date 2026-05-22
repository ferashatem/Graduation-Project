import apiClient from "./apiClient";

/**
 * Upload a single file to Cloudflare R2 via the centralized file service.
 * Returns the fileId to be reused in other API calls (chat attachments,
 * course materials, assignments, etc.).
 *
 * @param {File} file
 * @returns {Promise<string>} fileId
 */
export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/File/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const payload = res.data?.data ?? res.data;
  const fileId = payload?.fileId ?? payload;

  if (!fileId) throw new Error("File upload succeeded but no fileId was returned.");
  return fileId;
};

// GET /api/File — list my uploaded files
export const fetchMyFiles = async () => {
  const res = await apiClient.get("/File");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};
