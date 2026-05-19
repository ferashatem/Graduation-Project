import apiClient from "../../../api/apiClient";

export const importStudents = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/students/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

export const downloadStudentCredentials = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post(
    "/students/import-excel/download-credentials",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
      validateStatus: () => true,
    }
  );

  const contentType = res.headers["content-type"] || "";
  if (contentType.includes("json")) {
    const text = await res.data.text();
    const json = JSON.parse(text);
    return {
      ok: false,
      message:
        json?.data?.message || json?.message || "No students were imported.",
    };
  }

  return {
    ok: true,
    blob: res.data,
    summary: res.headers["x-import-summary"] || "",
  };
};

export const downloadImportTemplate = async () => {
  const res = await apiClient.get("/students/import-excel/template", {
    responseType: "blob",
  });
  triggerBlobDownload(res.data, "student_import_template.xlsx");
};

export const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseSummaryHeader = (summary) => {
  const result = {};
  if (!summary) return result;
  summary.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k && v !== undefined) result[k.trim()] = parseInt(v.trim()) || 0;
  });
  return result;
};
