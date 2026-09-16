import type { SolutionMeta } from "../../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../../i18n/index.js";

export function renderSolutionMetaSection(meta: SolutionMeta, locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).render.solutionMeta;
  const lines = [`## ${messages.heading({ name: meta.name })}`, ""];
  lines.push(`- **${messages.id}** ${meta.id}`);
  if (meta.version) lines.push(`- **${messages.version}** ${meta.version}`);
  if (meta.publisher) lines.push(`- **${messages.publisher}** ${meta.publisher}`);
  lines.push("");
  return lines.join("\n");
}
