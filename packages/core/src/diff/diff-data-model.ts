import type { DataModel, Relationship } from "../ir/index.js";
import { diffKeyedArray, diffPrimitive, type DiffEntry } from "./diff-utils.js";

function relationshipKey(rel: Relationship): string {
  return `${rel.from.table}.${rel.from.column}->${rel.to.table}.${rel.to.column}`;
}

export function diffDataModel(before: DataModel, after: DataModel): DiffEntry[] {
  const entries: DiffEntry[] = [];

  diffKeyedArray(
    "tables",
    before.tables,
    after.tables,
    (table) => table.name,
    (path, b, a, e) => {
      diffPrimitive(`${path}.isHidden`, b.isHidden, a.isHidden, e);
      diffPrimitive(`${path}.sourceExpression`, b.sourceExpression, a.sourceExpression, e);
      diffKeyedArray(
        `${path}.columns`,
        b.columns,
        a.columns,
        (column) => column.name,
        (columnPath, columnBefore, columnAfter, ce) => {
          diffPrimitive(`${columnPath}.dataType`, columnBefore.dataType, columnAfter.dataType, ce);
          diffPrimitive(`${columnPath}.isCalculated`, columnBefore.isCalculated, columnAfter.isCalculated, ce);
          diffPrimitive(`${columnPath}.expression`, columnBefore.expression, columnAfter.expression, ce);
        },
        e,
      );
    },
    entries,
  );

  diffKeyedArray(
    "measures",
    before.measures,
    after.measures,
    (measure) => `${measure.table}.${measure.name}`,
    (path, b, a, e) => {
      diffPrimitive(`${path}.expression`, b.expression, a.expression, e);
      diffPrimitive(`${path}.formatString`, b.formatString, a.formatString, e);
    },
    entries,
  );

  diffKeyedArray(
    "relationships",
    before.relationships,
    after.relationships,
    relationshipKey,
    (path, b, a, e) => {
      diffPrimitive(`${path}.cardinality`, b.cardinality, a.cardinality, e);
      diffPrimitive(`${path}.crossFilter`, b.crossFilter, a.crossFilter, e);
      diffPrimitive(`${path}.isActive`, b.isActive, a.isActive, e);
    },
    entries,
  );

  return entries;
}
