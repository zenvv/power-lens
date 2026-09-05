import type { DataSource, Diagnostic } from "../../ir/index.js";
import type { RawDataSourcesFile } from "./raw-shapes.js";
import { readText } from "../zip.js";

const DATA_SOURCES_PATH = "References/DataSources.json";

/**
 * References/DataSources.json is a flat list mixing real connected data
 * sources with Cloud Flow references ("ServiceInfo") and design-time sample
 * data ("StaticDataSourceInfo") — docs/FORMAT-NOTES.md section 1.6. Only
 * genuine data sources belong in CanvasApp.dataSources; the file being
 * absent entirely (an app with no connections) is expected, not an error.
 */
export function parseDataSources(entries: Record<string, Uint8Array>, diagnostics: Diagnostic[]): DataSource[] {
  const text = readText(entries, DATA_SOURCES_PATH);
  if (text === undefined) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    diagnostics.push({
      code: "PL104",
      severity: "warning",
      message: `${DATA_SOURCES_PATH} não é um JSON válido: ${String(err)}`,
      path: DATA_SOURCES_PATH,
    });
    return [];
  }

  const list = (parsed as RawDataSourcesFile).DataSources;
  if (!Array.isArray(list)) return [];

  const result: DataSource[] = [];
  for (const entry of list) {
    if (!entry.Name || entry.Type === "ServiceInfo" || entry.Type === "StaticDataSourceInfo") {
      continue;
    }
    result.push({ name: entry.Name, type: entry.Type ?? "Unknown" });
  }
  return result;
}
