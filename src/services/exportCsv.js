export function exportRowsToCsv(filename, headers, rows) {
  const toCsvCell = (val) => {
    const s = String(val ?? "");
    const needsQuote = /[",\n]/.test(s);
    const esc = s.replace(/"/g, '""');
    return needsQuote ? `"${esc}"` : esc;
  };

  const csv = [headers.map(toCsvCell).join(",")]
    .concat(rows.map((row) => row.map(toCsvCell).join(",")))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
