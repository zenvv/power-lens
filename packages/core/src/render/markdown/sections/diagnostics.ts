import type { Diagnostic, DiagnosticSeverity } from "../../../ir/index.js";

const SEVERITY_ORDER: Record<DiagnosticSeverity, number> = { error: 0, warning: 1, info: 2 };

export function renderDiagnosticsSection(diagnostics: readonly Diagnostic[]): string {
  if (diagnostics.length === 0) {
    return "## Diagnósticos\n\nNenhum diagnóstico.\n";
  }

  const sorted = [...diagnostics].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const lines = ["## Diagnósticos", "", "| Severidade | Código | Mensagem | Caminho |", "|---|---|---|---|"];
  for (const diagnostic of sorted) {
    const message = diagnostic.message.replace(/\|/g, "\\|");
    lines.push(`| ${diagnostic.severity} | ${diagnostic.code} | ${message} | ${diagnostic.path ?? ""} |`);
  }
  lines.push("");
  return lines.join("\n");
}
