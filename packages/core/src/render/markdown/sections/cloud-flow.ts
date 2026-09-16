import type { CloudFlow } from "../../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../../i18n/index.js";

export function renderCloudFlowSection(flow: CloudFlow, locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).render.cloudFlow;
  const lines = [`## ${messages.heading({ name: flow.name })}`, ""];
  lines.push(`- **${messages.id}** ${flow.id}`);
  lines.push(`- **${messages.trigger}** ${flow.trigger.name} _(${flow.trigger.type})_`);
  lines.push(`- **${messages.actions}** ${flow.actions.length}`);
  lines.push(`- **${messages.connections}** ${flow.connections.map((c) => c.name).join(", ") || messages.none}`);
  lines.push("");

  if (flow.actions.length > 0) {
    lines.push(`### ${messages.actionsHeading}`, "");
    for (const action of flow.actions) {
      const branch = action.branch ? messages.branchSuffix({ branch: action.branch }) : "";
      const parent = action.parentId ? messages.insideParent({ parentId: action.parentId, branch }) : "";
      const summary = action.summary ? ` — ${action.summary}` : "";
      lines.push(`- **${action.name}** _(${action.type})_${parent}${summary}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
