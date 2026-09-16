import {
  createEmptyDocument,
  type DataModel,
  type Diagnostic,
  type Measure,
  type ModelColumn,
  type ModelTable,
  type PowerLensDocument,
  type Relationship,
} from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";
import { readUtf16LEText, unzipNormalized } from "../zip.js";
import { parseReportLayout } from "./report.js";
import type { RawColumn, RawDataModelSchema, RawMeasure, RawRelationship, RawTable, RawTmslExpression } from "./raw-shapes.js";

export type PbitSource = {
  fileName: string;
  fileSize: number;
};

function joinExpression(expression: RawTmslExpression | undefined): string | undefined {
  if (expression === undefined) return undefined;
  return Array.isArray(expression) ? expression.join("\n") : expression;
}

/**
 * fromCardinality/toCardinality default to "many"/"one" when omitted — the
 * example .pbit's auto-generated date relationships all omit them and are
 * many-to-one (docs/FORMAT-NOTES.md seção 6, confirmado na doc oficial de
 * TMSL). "none" is not a real-world case we've observed; it falls back to
 * manyToOne with a diagnostic rather than producing an invalid IR value.
 */
function mapCardinality(
  rel: RawRelationship,
  diagnostics: Diagnostic[],
  path: string,
  locale: Locale = DEFAULT_LOCALE,
): Relationship["cardinality"] {
  const from = rel.fromCardinality ?? "many";
  const to = rel.toCardinality ?? "one";

  if ((from !== "one" && from !== "many") || (to !== "one" && to !== "many")) {
    diagnostics.push({
      code: "PL504",
      severity: "info",
      message: getMessages(locale).parsers.powerbi.cardinalityUnexpected({ from, to }),
      path,
    });
    return "manyToOne";
  }

  if (from === "one" && to === "one") return "oneToOne";
  if (from === "one" && to === "many") return "oneToMany";
  if (from === "many" && to === "many") return "manyToMany";
  return "manyToOne";
}

/**
 * crossFilteringBehavior default is "automatic" when omitted, which lets the
 * engine choose at query time — there's no faithful single/both mapping for
 * that, so it's approximated as "single" (the common real-world behavior for
 * a non-bidirectional relationship). docs/FORMAT-NOTES.md seção 6.
 */
function mapCrossFilter(rel: RawRelationship): Relationship["crossFilter"] {
  return rel.crossFilteringBehavior === "bothDirections" ? "both" : "single";
}

function mapColumn(raw: RawColumn, noName: string): ModelColumn {
  const isCalculated = raw.type === "calculated";
  return {
    name: raw.name ?? noName,
    dataType: raw.dataType ?? "unknown",
    isCalculated,
    ...(isCalculated && joinExpression(raw.expression) !== undefined
      ? { expression: joinExpression(raw.expression) }
      : {}),
  };
}

function mapMeasure(raw: RawMeasure, tableName: string, noName: string): Measure {
  return {
    name: raw.name ?? noName,
    table: tableName,
    expression: joinExpression(raw.expression) ?? "",
    ...(raw.formatString ? { formatString: raw.formatString } : {}),
  };
}

function mapTable(raw: RawTable, noName: string): ModelTable {
  const name = raw.name ?? noName;
  const sourceExpression = joinExpression(raw.partitions?.[0]?.source?.expression);
  return {
    name,
    columns: (raw.columns ?? []).map((column) => mapColumn(column, noName)),
    ...(sourceExpression !== undefined ? { sourceExpression } : {}),
    ...(raw.isHidden ? { isHidden: true } : {}),
  };
}

/**
 * Parses a .pbit's DataModelSchema (TMSL) into a PowerLensDocument with a
 * DataModel artifact, plus Report/Layout (páginas/visuais) quando presente.
 * Never throws — every failure degrades to a Diagnostic (spec principle:
 * "degradação honesta").
 */
export function parsePbit(bytes: Uint8Array, source: PbitSource, locale: Locale = DEFAULT_LOCALE): PowerLensDocument {
  const messages = getMessages(locale).parsers;
  const document = createEmptyDocument({ ...source, detectedFormat: "pbit" });
  const diagnostics: Diagnostic[] = [];

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipNormalized(bytes);
  } catch (err) {
    diagnostics.push({
      code: "PL500",
      severity: "error",
      message: messages.powerbi.cantOpenZip({ error: String(err) }),
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const schemaText = readUtf16LEText(entries, "DataModelSchema");
  if (schemaText === undefined) {
    diagnostics.push({
      code: "PL501",
      severity: "error",
      message: messages.powerbi.dataModelSchemaNotFound,
    });
    document.diagnostics = diagnostics;
    return document;
  }

  let schema: RawDataModelSchema;
  try {
    schema = JSON.parse(schemaText) as RawDataModelSchema;
  } catch (err) {
    diagnostics.push({
      code: "PL502",
      severity: "error",
      message: messages.powerbi.dataModelSchemaInvalidJson({ error: String(err) }),
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const rawTables = schema.model?.tables;
  if (!Array.isArray(rawTables)) {
    diagnostics.push({
      code: "PL503",
      severity: "warning",
      message: messages.powerbi.modelTablesNotFound,
    });
  }

  const tables = (rawTables ?? []).map((table) => mapTable(table, messages.common.noName));

  const measures: Measure[] = [];
  for (const rawTable of rawTables ?? []) {
    const tableName = rawTable.name ?? messages.common.noName;
    for (const rawMeasure of rawTable.measures ?? []) {
      measures.push(mapMeasure(rawMeasure, tableName, messages.common.noName));
    }
  }

  const relationships: Relationship[] = (schema.model?.relationships ?? []).map((rel) => {
    const from = { table: rel.fromTable ?? messages.common.unknown, column: rel.fromColumn ?? messages.common.unknown };
    const to = { table: rel.toTable ?? messages.common.unknown, column: rel.toColumn ?? messages.common.unknown };
    const path = `${from.table}.${from.column} -> ${to.table}.${to.column}`;
    return {
      from,
      to,
      cardinality: mapCardinality(rel, diagnostics, path, locale),
      crossFilter: mapCrossFilter(rel),
      isActive: rel.isActive ?? true,
    };
  });

  const modelName = source.fileName.replace(/\.pbit$/i, "");
  const dataModel: DataModel = {
    kind: "dataModel",
    id: schema.name ?? modelName,
    name: modelName,
    tables,
    relationships,
    measures,
  };

  document.artifacts = [dataModel];

  const reportLayoutText = readUtf16LEText(entries, "Report/Layout");
  if (reportLayoutText !== undefined) {
    const report = parseReportLayout(reportLayoutText, `${dataModel.id}-report`, diagnostics, locale);
    if (report) document.artifacts.push(report);
  }

  document.diagnostics = diagnostics;
  return document;
}
