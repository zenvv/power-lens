import type { CloudFlow } from "../../../ir/index.js";

export function renderCloudFlowSection(flow: CloudFlow): string {
  const lines = [`## Fluxo: ${flow.name}`, ""];
  lines.push(`- **Id:** ${flow.id}`);
  lines.push(`- **Gatilho:** ${flow.trigger.name} _(${flow.trigger.type})_`);
  lines.push(`- **Ações:** ${flow.actions.length}`);
  lines.push(`- **Conexões:** ${flow.connections.map((c) => c.name).join(", ") || "nenhuma"}`);
  lines.push("");

  if (flow.actions.length > 0) {
    lines.push("### Ações", "");
    for (const action of flow.actions) {
      const branch = action.branch ? `, branch "${action.branch}"` : "";
      const parent = action.parentId ? ` (dentro de ${action.parentId}${branch})` : "";
      const summary = action.summary ? ` — ${action.summary}` : "";
      lines.push(`- **${action.name}** _(${action.type})_${parent}${summary}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
