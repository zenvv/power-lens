import type { CanvasApp } from "../../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../../i18n/index.js";
import { renderControlTree } from "../render-control-tree.js";

export function renderCanvasAppSection(app: CanvasApp, locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).render.canvasApp;
  const lines: string[] = [`## ${messages.heading({ name: app.name })}`, ""];
  lines.push(`- **${messages.id}** ${app.id}`);
  lines.push(`- **${messages.screens}** ${app.screens.length}`);
  lines.push(`- **${messages.components}** ${app.components.length}`);
  lines.push(`- **${messages.dataSources}** ${app.dataSources.length}`);
  lines.push(`- **${messages.variables}** ${app.variables.length}`);
  lines.push("");

  if (app.onStart) {
    lines.push(`### ${messages.onStartHeading}`, "", "```", app.onStart.raw, "```", "");
  }

  if (app.dataSources.length > 0) {
    lines.push(`### ${messages.dataSourcesHeading}`, "");
    for (const dataSource of app.dataSources) {
      lines.push(`- ${dataSource.name} _(${dataSource.type})_`);
    }
    lines.push("");
  }

  if (app.variables.length > 0) {
    lines.push(`### ${messages.variablesHeading}`, "");
    for (const variable of app.variables) {
      lines.push(`- ${variable.name} _(${variable.kind})_`);
    }
    lines.push("");
  }

  for (const screen of [...app.screens].sort((a, b) => a.order - b.order)) {
    lines.push(`### ${messages.screenHeading({ name: screen.name })}`, "", renderControlTree(screen.root), "");
  }

  for (const component of app.components) {
    lines.push(`### ${messages.componentHeading({ name: component.name })}`, "", renderControlTree(component.root), "");
  }

  return lines.join("\n");
}
