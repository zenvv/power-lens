import type { DataModel, Diagnostic, PowerLensDocument } from "../ir/index.js";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Confere se `name` aparece como token inteiro em `haystack` (não como
 * substring de outro identificador — "Order" não deve casar dentro de
 * "Orders"). Extração rasa por design (mesmo espírito de PL003/PL006): não
 * há um parser de DAX/M de verdade neste projeto, só uma busca textual
 * suficiente pra reduzir falso positivo óbvio. */
function containsWholeWord(haystack: string, name: string): boolean {
  return new RegExp(`(?<![\\w])${escapeRegExp(name)}(?![\\w])`, "u").test(haystack);
}

function collectExpressionHaystacks(model: DataModel): string[] {
  const haystacks: string[] = [];
  for (const measure of model.measures) haystacks.push(measure.expression);
  for (const table of model.tables) {
    if (table.sourceExpression) haystacks.push(table.sourceExpression);
    for (const column of table.columns) {
      if (column.expression) haystacks.push(column.expression);
    }
  }
  return haystacks;
}

/** PL013 — tabela ou coluna do modelo de dados que não aparece em nenhum
 * relacionamento nem em nenhuma fórmula (medida, coluna calculada, expressão
 * de origem) encontrada no modelo. */
export function pl013UnusedModelEntity(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "dataModel") continue;

    const haystacks = collectExpressionHaystacks(artifact);
    const tablesInRelationships = new Set<string>();
    const columnsInRelationships = new Set<string>();
    for (const rel of artifact.relationships) {
      tablesInRelationships.add(rel.from.table);
      tablesInRelationships.add(rel.to.table);
      columnsInRelationships.add(`${rel.from.table}.${rel.from.column}`);
      columnsInRelationships.add(`${rel.to.table}.${rel.to.column}`);
    }

    for (const table of artifact.tables) {
      const tableUsed =
        tablesInRelationships.has(table.name) || haystacks.some((h) => containsWholeWord(h, table.name));

      if (!tableUsed) {
        diagnostics.push({
          code: "PL013",
          severity: "warning",
          message: `Tabela "${table.name}" não aparece em nenhum relacionamento nem fórmula encontrada no modelo.`,
          artifactId: artifact.id,
          hint: "A busca é textual, não um parser de DAX/M completo — confirme antes de remover, pode ser usada de um jeito que a análise não capturou.",
        });
        continue;
      }

      for (const column of table.columns) {
        const columnUsed =
          columnsInRelationships.has(`${table.name}.${column.name}`) ||
          haystacks.some((h) => containsWholeWord(h, column.name));
        if (columnUsed) continue;

        diagnostics.push({
          code: "PL013",
          severity: "info",
          message: `Coluna "${table.name}.${column.name}" não aparece em nenhum relacionamento nem fórmula encontrada no modelo.`,
          artifactId: artifact.id,
          path: `${table.name}.${column.name}`,
          hint: "A busca é textual, não um parser de DAX/M completo — confirme antes de remover, pode ser usada só num visual do relatório.",
        });
      }
    }
  }

  return diagnostics;
}
