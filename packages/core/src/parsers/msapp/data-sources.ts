import type { DataSource, Diagnostic } from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";
import type { RawDataSourcesFile } from "./raw-shapes.js";
import { readText } from "../zip.js";

const DATA_SOURCES_PATH = "References/DataSources.json";

/**
 * `ApiId` bruto é algo como "/providers/microsoft.powerapps/apis/shared_sql"
 * (docs/FORMAT-NOTES.md seção 1.6) — extrai só o slug do conector
 * ("sql"), sem o prefixo "shared_" nem o resto do path.
 */
function extractConnectorId(apiId: string | undefined): string | undefined {
  if (!apiId) return undefined;
  const match = /\/apis\/(?:shared_)?([^/]+)$/i.exec(apiId);
  return match?.[1]?.toLowerCase();
}

/**
 * References/DataSources.json is a flat list mixing real connected data
 * sources with Cloud Flow references ("ServiceInfo") and design-time sample
 * data ("StaticDataSourceInfo") — docs/FORMAT-NOTES.md section 1.6. Only
 * genuine data sources belong in CanvasApp.dataSources; the file being
 * absent entirely (an app with no connections) is expected, not an error.
 */
export function parseDataSources(
  entries: Record<string, Uint8Array>,
  diagnostics: Diagnostic[],
  locale: Locale = DEFAULT_LOCALE,
): DataSource[] {
  const text = readText(entries, DATA_SOURCES_PATH);
  if (text === undefined) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    diagnostics.push({
      code: "PL104",
      severity: "warning",
      message: getMessages(locale).parsers.msapp.dataSourcesInvalidJson({ path: DATA_SOURCES_PATH, error: String(err) }),
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
    const connectorId = extractConnectorId(entry.ApiId);
    result.push({ name: entry.Name, type: entry.Type ?? "Unknown", ...(connectorId ? { connectorId } : {}) });
  }
  return result;
}
