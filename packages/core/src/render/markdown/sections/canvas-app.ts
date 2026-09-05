import type { CanvasApp } from "../../../ir/index.js";
import { renderControlTree } from "../render-control-tree.js";

export function renderCanvasAppSection(app: CanvasApp): string {
  const lines: string[] = [`## App Canvas: ${app.name}`, ""];
  lines.push(`- **Id:** ${app.id}`);
  lines.push(`- **Telas:** ${app.screens.length}`);
  lines.push(`- **Componentes:** ${app.components.length}`);
  lines.push(`- **Fontes de dados:** ${app.dataSources.length}`);
  lines.push(`- **Variáveis/coleções:** ${app.variables.length}`);
  lines.push("");

  if (app.onStart) {
    lines.push("### OnStart do app", "", "```", app.onStart.raw, "```", "");
  }

  if (app.dataSources.length > 0) {
    lines.push("### Fontes de dados", "");
    for (const dataSource of app.dataSources) {
      lines.push(`- ${dataSource.name} _(${dataSource.type})_`);
    }
    lines.push("");
  }

  if (app.variables.length > 0) {
    lines.push("### Variáveis e coleções", "");
    for (const variable of app.variables) {
      lines.push(`- ${variable.name} _(${variable.kind})_`);
    }
    lines.push("");
  }

  for (const screen of [...app.screens].sort((a, b) => a.order - b.order)) {
    lines.push(`### Tela: ${screen.name}`, "", renderControlTree(screen.root), "");
  }

  for (const component of app.components) {
    lines.push(`### Componente: ${component.name}`, "", renderControlTree(component.root), "");
  }

  return lines.join("\n");
}
