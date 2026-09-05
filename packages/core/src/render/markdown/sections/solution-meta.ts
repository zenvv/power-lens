import type { SolutionMeta } from "../../../ir/index.js";

export function renderSolutionMetaSection(meta: SolutionMeta): string {
  const lines = [`## Solution: ${meta.name}`, ""];
  lines.push(`- **Id:** ${meta.id}`);
  if (meta.version) lines.push(`- **Versão:** ${meta.version}`);
  if (meta.publisher) lines.push(`- **Publisher:** ${meta.publisher}`);
  lines.push("");
  return lines.join("\n");
}
