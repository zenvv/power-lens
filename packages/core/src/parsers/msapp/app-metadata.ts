import type { Diagnostic } from "../../ir/index.js";
import type { RawPropertiesFile } from "./raw-shapes.js";
import { readText } from "./zip.js";

const PROPERTIES_PATH = "Properties.json";

export function parseAppMetadata(
  entries: Record<string, Uint8Array>,
  fallbackName: string,
  diagnostics: Diagnostic[],
): { id: string; name: string } {
  const text = readText(entries, PROPERTIES_PATH);
  if (text === undefined) {
    diagnostics.push({
      code: "PL106",
      severity: "warning",
      message: `${PROPERTIES_PATH} não encontrado; usando o nome do arquivo como id/nome do app.`,
      path: PROPERTIES_PATH,
    });
    return { id: fallbackName, name: fallbackName };
  }

  try {
    const parsed = JSON.parse(text) as RawPropertiesFile;
    return {
      id: parsed.Id || fallbackName,
      name: parsed.Name || fallbackName,
    };
  } catch (err) {
    diagnostics.push({
      code: "PL107",
      severity: "warning",
      message: `${PROPERTIES_PATH} não é um JSON válido: ${String(err)}`,
      path: PROPERTIES_PATH,
    });
    return { id: fallbackName, name: fallbackName };
  }
}
