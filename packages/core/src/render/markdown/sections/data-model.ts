import type { DataModel } from "../../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../../i18n/index.js";

export function renderDataModelSection(model: DataModel, locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).render.dataModel;
  const lines = [`## ${messages.heading({ name: model.name })}`, ""];
  lines.push(`- **${messages.tables}** ${model.tables.length}`);
  lines.push(`- **${messages.relationships}** ${model.relationships.length}`);
  lines.push(`- **${messages.measures}** ${model.measures.length}`);
  lines.push("");

  for (const table of model.tables) {
    lines.push(`### ${messages.tableHeading({ name: table.name })}`, "", messages.columnTableHeader, "|---|---|---|");
    for (const column of table.columns) {
      lines.push(`| ${column.name} | ${column.dataType} | ${column.isCalculated ? messages.yes : messages.no} |`);
    }
    lines.push("");
  }

  if (model.relationships.length > 0) {
    lines.push(`### ${messages.relationshipsHeading}`, "");
    for (const rel of model.relationships) {
      const inactive = rel.isActive ? "" : messages.inactiveSuffix;
      lines.push(`- ${rel.from.table}.${rel.from.column} → ${rel.to.table}.${rel.to.column} _(${rel.cardinality}${inactive})_`);
    }
    lines.push("");
  }

  if (model.measures.length > 0) {
    lines.push(`### ${messages.measuresHeading}`, "");
    for (const measure of model.measures) {
      lines.push(`- **${measure.name}** (${measure.table}): \`${measure.expression}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}
