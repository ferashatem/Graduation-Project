import { useState } from "react";

export function useFileUpload(uploadFn) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async (...args) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await uploadFn(...args, setProgress);
      setProgress(100);
      return result;
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Upload failed.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setError(null);
  };

  return { upload, uploading, progress, error, reset };
}
