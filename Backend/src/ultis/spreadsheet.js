import XLSX from "xlsx";

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return date.toISOString().slice(0, 10);
    }
    return null;
  }
  const s = String(value || "").trim();
  if (!s) return null;

  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00Z");
    if (!Number.isNaN(d.getTime())) return s;
  }

  // Try MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    let [, m, d, y] = slashMatch.map(Number);
    if (m > 12) [m, d] = [d, m]; // If month > 12, swap to DD/MM format
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900) {
      const date = new Date(Date.UTC(y, m - 1, d));
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }

  // Try DD-MM-YYYY
  const dashMatch = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    let [, d, m, y] = dashMatch.map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900) {
      const date = new Date(Date.UTC(y, m - 1, d));
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }

  return null;
}

// Parse first sheet of a CSV/XLS/XLSX buffer into plain objects
// options: { parseDates?: boolean } default true
export function parseSpreadsheet(buffer, options = {}) {
  const { parseDates = true } = options;
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, blankrows: false });
  return rows
    .map((row) => normalizeRow(row, { parseDates }))
    .filter((row) => Object.values(row).some((v) => v !== null && String(v).trim() !== ""));
}

function normalizeRow(row = {}, { parseDates = true } = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;
    normalized[cleanKey] = normalizeCell(value, { parseDates });
  }
  return normalized;
}

export function normalizeCell(value, { parseDates = true } = {}) {
  if (value == null) return null;
  if (parseDates) {
    const dateStr = parseDate(value);
    if (dateStr) return dateStr;
  }
  if (typeof value === "number") return value;
  if (typeof value === "string") return value.trim();
  return value;
}
