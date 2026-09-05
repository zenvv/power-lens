import type { PowerLensDocument, SourceFormat } from "../../../ir/index.js";

const FORMAT_LABEL: Record<SourceFormat, string> = {
  msapp: ".msapp (Canvas App)",
  solution: "Solution .zip",
  flow: "Definição de fluxo",
  pbit: ".pbit",
  pbip: ".pbip",
  pbix: ".pbix",
};

export function renderSummarySection(document: PowerLensDocument): string {
  const lines = [`# ${document.source.fileName}`, ""];
  lines.push(`- **Formato:** ${FORMAT_LABEL[document.source.detectedFormat]}`);
  lines.push(`- **Tamanho:** ${document.source.fileSize} bytes`);
  lines.push(`- **Analisado em:** ${document.source.parsedAt}`);
  lines.push(`- **Versão do parser:** ${document.source.parserVersion}`);
  lines.push(`- **Artefatos:** ${document.artifacts.length}`);
  lines.push("");
  return lines.join("\n");
}
