import type { Report } from "../../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../../i18n/index.js";

export function renderReportSection(report: Report, locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).render.report;
  const lines = [`## ${messages.heading({ name: report.name })}`, ""];

  for (const page of [...report.pages].sort((a, b) => a.order - b.order)) {
    lines.push(`### ${messages.pageHeading({ name: page.name })}`, "");
    for (const visual of page.visuals) {
      const title = visual.title ?? messages.untitled;
      const fields = visual.fields.join(", ") || messages.none;
      lines.push(`- ${title} _(${visual.type})_ — ${messages.fieldsPrefix} ${fields}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
