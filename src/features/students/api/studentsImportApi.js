import apiClient from "../../../api/apiClient";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportCredentialsXlsx = (result) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Successful
  const successRows = (result.importedCredentials ?? []).map((s, i) => ({
    "#": i + 1,
    "Full Name": s.fullName ?? "",
    "University ID": s.universityStudentId ?? "",
    "Academic Email": s.universityEmail ?? "",
    "Temp Password": s.temporaryPassword ?? result.temporaryPassword ?? "",
    Batch: s.batchCode ?? "",
    Group: s.groupCode ?? "",
    Department: s.department ?? "",
    Status: "✓ Imported",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(successRows), "✓ Successful Students");

  // Sheet 2: Failed
  const failedRows = (result.failedRows ?? []).map((f) => ({
    "Row #": f.rowNumber ?? "",
    "Full Name": f.fullName ?? "",
    "National ID": f.nationalId ?? "",
    "Batch Code": f.batchCode ?? "",
    "Group Code": f.groupCode ?? "",
    Status: "✗ Failed",
    "Error Message": f.errorMessage ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(failedRows.length ? failedRows : [{ Note: "No failed rows" }]), "✗ Failed Rows");

  // Sheet 3: Summary
  const summaryRows = [
    { Field: "Total Rows", Value: result.totalRows ?? 0 },
    { Field: "Imported", Value: result.imported ?? 0 },
    { Field: "Skipped", Value: result.skipped ?? 0 },
    { Field: "Failed", Value: result.failed ?? 0 },
    { Field: "Warnings", Value: (result.warnings ?? []).length },
    { Field: "Default Password", Value: result.temporaryPassword ?? "" },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "📊 Summary");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `credentials_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importStudents = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/ai-tools/bulk-create-students", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    validateStatus: (s) => s === 200 || s === 207,
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
