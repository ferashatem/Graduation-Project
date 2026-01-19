import React, { useCallback, useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { functions } from "../../firebase/firebaseConfig";
import BigLogo from "../../assets/university-logo.png";

const ACCEPTED_ROLES = [
  "super_admin",
  "admin",
  "professor",
  "assistant",
  "student",
];

const TEMPLATE_HEADERS = ["username", "email", "phone", "password", "role"];
const TEMPLATE_SAMPLE_ROW = [
  "Jane Doe",
  "jane.doe@example.com",
  "+201000000000",
  "ChangeMe123",
  "student",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HEADER_ALIASES = {
  username: "username",
  "user name": "username",
  name: "username",
  "full name": "username",
  fullname: "username",
  email: "email",
  "e mail": "email",
  phone: "phone",
  "phone number": "phone",
  phonenumber: "phone",
  password: "password",
  role: "role",
};

const normalizeHeaderValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const normalizeCellValue = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const buildHeaderIndexMap = (headers = []) => {
  const map = {};
  headers.forEach((header, index) => {
    const normalized = normalizeHeaderValue(header);
    const key = HEADER_ALIASES[normalized];
    if (key && map[key] === undefined) {
      map[key] = index;
    }
  });
  return map;
};

const buildResultMessage = (result) => {
  const warningText = Array.isArray(result?.warnings)
    ? result.warnings.join("; ")
    : result?.warnings;

  if (result?.status === "failed") {
    return result?.error || "Failed to create user.";
  }

  return warningText || "Created successfully.";
};

function BulkImportUsersPage() {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResults, setImportResults] = useState([]);

  const bulkCreateUsers = useMemo(
    () => httpsCallable(functions, "bulkCreateUsers"),
    [functions]
  );

  const validationRows = useMemo(
    () =>
      rows.map((row) => {
        const errors = [];

        if (!row.username || row.username.length < 2) {
          errors.push("Username must be at least 2 characters.");
        }

        if (!row.email) {
          errors.push("Email is required.");
        } else if (!EMAIL_PATTERN.test(row.email)) {
          errors.push("Email format is invalid.");
        }

        if (!row.password || row.password.length < 6) {
          errors.push("Password must be at least 6 characters.");
        }

        if (!row.role) {
          errors.push("Role is required.");
        } else if (!ACCEPTED_ROLES.includes(row.role)) {
          errors.push(`Role must be one of: ${ACCEPTED_ROLES.join(", ")}.`);
        }

        if (row.phone && typeof row.phone !== "string") {
          errors.push("Phone must be a string.");
        }

        return { ...row, errors };
      }),
    [rows]
  );

  const hasErrors = useMemo(
    () => validationRows.some((row) => row.errors.length > 0),
    [validationRows]
  );

  const errorCount = useMemo(
    () =>
      validationRows.reduce((total, row) => total + row.errors.length, 0),
    [validationRows]
  );

  const canImport = useMemo(
    () => validationRows.length > 0 && !hasErrors && !importing,
    [validationRows.length, hasErrors, importing]
  );

  const resultSummary = useMemo(() => {
    const successCount = importResults.filter(
      (result) => result?.status === "success"
    ).length;
    return {
      successCount,
      failedCount: importResults.length - successCount,
    };
  }, [importResults]);

  const handleDownloadTemplate = useCallback(() => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      TEMPLATE_SAMPLE_ROW,
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "bulk_users_template.xlsx");
  }, []);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParseError("");
    setImportError("");
    setImportResults([]);
    setSelectedFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("The workbook does not contain any sheets.");
      }

      const worksheet = workbook.Sheets[sheetName];
      const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      if (!sheetRows.length) {
        throw new Error("The first sheet is empty.");
      }

      const headerIndexMap = buildHeaderIndexMap(sheetRows[0]);
      const requiredHeaders = ["username", "email", "password", "role"];
      const missingHeaders = requiredHeaders.filter(
        (key) => headerIndexMap[key] === undefined
      );

      if (missingHeaders.length) {
        throw new Error(`Missing required headers: ${missingHeaders.join(", ")}.`);
      }

      const parsedRows = sheetRows
        .slice(1)
        .map((row, rowIndex) => {
          const username = normalizeCellValue(row[headerIndexMap.username]);
          const email = normalizeCellValue(row[headerIndexMap.email]).toLowerCase();
          const phone =
            headerIndexMap.phone !== undefined
              ? normalizeCellValue(row[headerIndexMap.phone])
              : "";
          const password = normalizeCellValue(row[headerIndexMap.password]);
          const role = normalizeCellValue(row[headerIndexMap.role]).toLowerCase();

          return {
            index: rowIndex,
            rowNumber: rowIndex + 2,
            username,
            email,
            phone,
            password,
            role,
          };
        })
        .filter((row) =>
          [row.username, row.email, row.phone, row.password, row.role].some(
            (value) => String(value || "").trim()
          )
        );

      if (!parsedRows.length) {
        setRows([]);
        setParseError("No data rows were found in the sheet.");
        return;
      }

      setRows(parsedRows);
    } catch (error) {
      console.error("Bulk import parse error:", error);
      setRows([]);
      setParseError(error?.message || "Failed to parse the selected file.");
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!canImport) return;

    setImporting(true);
    setImportError("");
    setImportResults([]);

    try {
      const payload = {
        users: validationRows.map((row) => ({
          username: row.username,
          email: row.email,
          phone: row.phone,
          password: row.password,
          role: row.role,
        })),
      };

      const response = await bulkCreateUsers(payload);
      const data = response?.data;
      const results = Array.isArray(data) ? data : data?.results || [];
      setImportResults(results);
    } catch (error) {
      console.error("Bulk import error:", error);
      setImportError(error?.message || "Bulk import failed.");
    } finally {
      setImporting(false);
    }
  }, [bulkCreateUsers, canImport, validationRows]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b2c4a]/10">
            <img
              src={BigLogo}
              alt="Benis Suef National University logo"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0b2c4a]">
              Bulk Import Users
            </h1>
            <p className="text-sm text-slate-600">
              Upload an Excel sheet to create multiple user accounts at once.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
        >
          Download Template
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0b2c4a]">
              Upload Excel File
            </h2>
            <p className="text-sm text-slate-600">
              Required headers: username, email, password, role. Phone is optional.
            </p>
            <p className="text-xs text-slate-500">
              Accepted roles: {ACCEPTED_ROLES.join(", ")}.
            </p>
          </div>
          <label className="flex w-full flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:w-auto">
            Select .xlsx / .xls
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#0b2c4a]/40 focus:ring-4 focus:ring-[#0b2c4a]/10"
            />
            {selectedFileName ? (
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                {selectedFileName}
              </span>
            ) : null}
          </label>
        </div>

        {parseError ? (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
            role="alert"
          >
            {parseError}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="mt-4 text-xs text-slate-500">
            Parsed {rows.length} rows from the first sheet.
          </div>
        ) : null}
      </div>

      {validationRows.length > 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#0b2c4a]">
                Preview & Validation
              </h2>
              <p className="text-sm text-slate-600">
                Review the rows before importing.
              </p>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={!canImport}
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#0b2c4a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:translate-y-[-1px] hover:bg-[#153a63] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {importing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                  Importing
                </>
              ) : (
                `Import ${validationRows.length} Users`
              )}
            </button>
          </div>

          {hasErrors ? (
            <div
              className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700"
              role="alert"
            >
              {errorCount} validation issue{errorCount === 1 ? "" : "s"} found.
              Fix all errors before importing.
            </div>
          ) : null}

          {importError ? (
            <div
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
              role="alert"
            >
              {importError}
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {validationRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.errors.length ? "bg-red-50/40" : ""}
                  >
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {row.rowNumber}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {row.username || "-"}
                    </td>
                    <td className="px-4 py-4">{row.email || "-"}</td>
                    <td className="px-4 py-4">{row.phone || "-"}</td>
                    <td className="px-4 py-4">{row.role || "-"}</td>
                    <td className="px-4 py-4 text-xs text-red-600">
                      {row.errors.length ? row.errors.join(" ") : "Ready"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {importResults.length > 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0b2c4a]">
                Import Results
              </h2>
              <p className="text-sm text-slate-600">
                Success: {resultSummary.successCount} | Failed:{" "}
                {resultSummary.failedCount}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {importResults.map((result, index) => (
                  <tr key={`${result?.email || "row"}-${index}`}>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {typeof result?.index === "number"
                        ? result.index + 1
                        : index + 1}
                    </td>
                    <td className="px-4 py-4">
                      {result?.email || "Unknown"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                          result?.status === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {result?.status || "failed"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {buildResultMessage(result)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default BulkImportUsersPage;
