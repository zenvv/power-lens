import type { DataModel } from "../../../ir/index.js";

export function renderDataModelSection(model: DataModel): string {
  const lines = [`## Modelo de dados: ${model.name}`, ""];
  lines.push(`- **Tabelas:** ${model.tables.length}`);
  lines.push(`- **Relacionamentos:** ${model.relationships.length}`);
  lines.push(`- **Medidas:** ${model.measures.length}`);
  lines.push("");

  for (const table of model.tables) {
    lines.push(`### Tabela: ${table.name}`, "", "| Coluna | Tipo | Calculada |", "|---|---|---|");
    for (const column of table.columns) {
      lines.push(`| ${column.name} | ${column.dataType} | ${column.isCalculated ? "sim" : "não"} |`);
    }
    lines.push("");
  }

  if (model.relationships.length > 0) {
    lines.push("### Relacionamentos", "");
    for (const rel of model.relationships) {
      const inactive = rel.isActive ? "" : ", inativo";
      lines.push(`- ${rel.from.table}.${rel.from.column} → ${rel.to.table}.${rel.to.column} _(${rel.cardinality}${inactive})_`);
    }
    lines.push("");
  }

  if (model.measures.length > 0) {
    lines.push("### Medidas", "");
    for (const measure of model.measures) {
      lines.push(`- **${measure.name}** (${measure.table}): \`${measure.expression}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}
