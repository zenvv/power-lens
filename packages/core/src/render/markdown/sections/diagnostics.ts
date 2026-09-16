import type { Diagnostic, DiagnosticSeverity } from "../../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../../i18n/index.js";

const SEVERITY_ORDER: Record<DiagnosticSeverity, number> = { error: 0, warning: 1, info: 2 };

export function renderDiagnosticsSection(diagnostics: readonly Diagnostic[], locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).render.diagnostics;
  if (diagnostics.length === 0) {
    return `## ${messages.heading}\n\n${messages.none}\n`;
  }

  const sorted = [...diagnostics].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const lines = [`## ${messages.heading}`, "", messages.tableHeader, "|---|---|---|---|"];
  for (const diagnostic of sorted) {
    const message = diagnostic.message.replace(/\|/g, "\\|");
    lines.push(`| ${diagnostic.severity} | ${diagnostic.code} | ${message} | ${diagnostic.path ?? ""} |`);
  }
  lines.push("");
  return lines.join("\n");
}
