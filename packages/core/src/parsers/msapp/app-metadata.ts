import type { Diagnostic } from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";
import type { RawPropertiesFile } from "./raw-shapes.js";
import { readText } from "../zip.js";

const PROPERTIES_PATH = "Properties.json";

export function parseAppMetadata(
  entries: Record<string, Uint8Array>,
  fallbackName: string,
  diagnostics: Diagnostic[],
  locale: Locale = DEFAULT_LOCALE,
): { id: string; name: string } {
  const messages = getMessages(locale).parsers.msapp;
  const text = readText(entries, PROPERTIES_PATH);
  if (text === undefined) {
    diagnostics.push({
      code: "PL106",
      severity: "warning",
      message: messages.propertiesNotFound({ path: PROPERTIES_PATH }),
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
      message: messages.propertiesInvalidJson({ path: PROPERTIES_PATH, error: String(err) }),
      path: PROPERTIES_PATH,
    });
    return { id: fallbackName, name: fallbackName };
  }
}
