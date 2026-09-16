import type { PowerLensDocument } from "../../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../../i18n/index.js";

export function renderSummarySection(document: PowerLensDocument, locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).render.summary;
  const lines = [`# ${document.source.fileName}`, ""];
  lines.push(`- **${messages.format}** ${messages.formatLabel[document.source.detectedFormat]}`);
  lines.push(`- **${messages.size}** ${document.source.fileSize} bytes`);
  lines.push(`- **${messages.analyzedAt}** ${document.source.parsedAt}`);
  lines.push(`- **${messages.parserVersion}** ${document.source.parserVersion}`);
  lines.push(`- **${messages.artifacts}** ${document.artifacts.length}`);
  lines.push("");
  return lines.join("\n");
}
