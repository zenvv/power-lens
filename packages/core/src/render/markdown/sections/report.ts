import type { Report } from "../../../ir/index.js";

export function renderReportSection(report: Report): string {
  const lines = [`## Relatório: ${report.name}`, ""];

  for (const page of [...report.pages].sort((a, b) => a.order - b.order)) {
    lines.push(`### Página: ${page.name}`, "");
    for (const visual of page.visuals) {
      const title = visual.title ?? "(sem título)";
      const fields = visual.fields.join(", ") || "nenhum";
      lines.push(`- ${title} _(${visual.type})_ — campos: ${fields}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
