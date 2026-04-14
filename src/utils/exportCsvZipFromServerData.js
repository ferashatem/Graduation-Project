// src/utils/exportCsvZipFromServerData.js
import { json2csv } from "json-2-csv"; // <-- FIXED: use json2csv (promise), not json2csvAsync
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Build a CSV string with a fixed column order.
 * - Returns header-only CSV if rows are empty.
 * - Adds BOM (\uFEFF) so Excel handles UTF-8/Arabic/RTL correctly.
 */
async function csvFrom(rows, keys) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "\uFEFF" + keys.join(",") + "\n";
  }
  // json2csv returns a Promise when no callback is provided
  const csv = await json2csv(rows, { keys, emptyFieldValue: "" });
  return "\uFEFF" + csv;
}

/**
 * Accepts the EXACT object you get from /api/submissions/csvData/:sub_id:
 * {
 *   client,            // { SSN, FirstName, LastName, DOB, Email, Phone, Address }
 *   dependents,        // [{ ClientSSN, DependentSSN, DependentFirstName, DependentLastName, DOB }, ...]
 *   income_resources,  // [{ ClientSSN, IncomeType, Payer, Amount, File }, ...]
 *   state_returns,     // [{ ClientSSN, State, StartDate, EndDate }, ...]
 *   submission         // casing like: FilingStatus, EV_Credit, ...
 * }
 */
export async function exportCsvFromServerData(server = {}) {
  const zip = new JSZip();

  const client = server.client || {};
  const dependents = Array.isArray(server.dependents) ? server.dependents : [];
  const income_resources = Array.isArray(server.income_resources)
    ? server.income_resources
    : [];
  const state_returns = Array.isArray(server.state_returns)
    ? server.state_returns
    : [];
  const submission = server.submission || {};

  // 1) client.csv (keep API casing)
  {
    const keys = ["SSN", "FirstName", "LastName", "DOB", "Email", "Phone", "Address"];
    const row = {
      SSN: client.SSN ?? "",
      FirstName: client.FirstName ?? "",
      LastName: client.LastName ?? "",
      DOB: client.DOB ?? "",
      Email: client.Email ?? "",
      Phone: client.Phone ?? "",
      Address: client.Address ?? "",
    };
    const csv = await csvFrom([row], keys);
    zip.file("client.csv", csv);
  }

  // 2) dependents.csv
  {
    const keys = [
      "ClientSSN",
      "DependentSSN",
      "DependentFirstName",
      "DependentLastName",
      "DOB",
    ];
    const rows = dependents.map((d) => ({
      ClientSSN: d.ClientSSN ?? "",
      DependentSSN: d.DependentSSN ?? "",
      DependentFirstName: d.DependentFirstName ?? "",
      DependentLastName: d.DependentLastName ?? "",
      DOB: d.DOB ?? "",
    }));
    const csv = await csvFrom(rows, keys);
    zip.file("dependents.csv", csv);
  }

  // 3) income_resources.csv
  {
    const keys = ["ClientSSN", "IncomeType", "Payer", "Amount", "File"];
    const rows = income_resources.map((i) => ({
      ClientSSN: i.ClientSSN ?? "",
      IncomeType: i.IncomeType ?? "",
      Payer: i.Payer ?? "",
      Amount: i.Amount ?? "",
      File: i.File ?? "",
    }));
    const csv = await csvFrom(rows, keys);
    zip.file("income_resources.csv", csv);
  }

  // 4) state_returns.csv
  {
    const keys = ["ClientSSN", "State", "StartDate", "EndDate"];
    const rows = state_returns.map((r) => ({
      ClientSSN: r.ClientSSN ?? "",
      State: r.State ?? "",
      StartDate: r.StartDate ?? "",
      EndDate: r.EndDate ?? "",
    }));
    const csv = await csvFrom(rows, keys);
    zip.file("state_returns.csv", csv);
  }

  // 5) submission.csv (keep API casing)
  {
    const keys = [
      "ClientSSN",
      "FilingStatus",
      "MortgageInterest",
      "PropertyTaxes",
      "CharitableDonations",
      "HSAContribution",
      "ResidentState",
      "StateTaxesPaid",
      "EV_Credit",
      "GrossFee",
    ];

    const row = {
      ClientSSN: submission.ClientSSN ?? "",
      FilingStatus: submission.FilingStatus ?? "",
      MortgageInterest: submission.MortgageInterest ?? "",
      PropertyTaxes: submission.PropertyTaxes ?? "",
      CharitableDonations: submission.CharitableDonations ?? "",
      HSAContribution: submission.HSAContribution ?? "",
      ResidentState: submission.ResidentState ?? "",
      StateTaxesPaid: submission.StateTaxesPaid ?? "",
      EV_Credit: submission.EV_Credit ?? "",
      GrossFee: submission.GrossFee ?? "",
    };

    const csv = await csvFrom([row], keys);
    zip.file("submission.csv", csv);
  }

  // Build filename like "ABDELRAZIK_AHMED_export.zip"
  const zipName = [
    client.FirstName || "client",
    client.LastName || "",
    "export",
  ]
    .filter(Boolean)
    .join("_")
    .replace(/\s+/g, "_");

  // Create and download the ZIP
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${zipName}.zip`);
}
