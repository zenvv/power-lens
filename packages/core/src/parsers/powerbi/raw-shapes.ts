/**
 * Loose shapes for TMSL (Tabular Model Scripting Language) as it appears
 * inside DataModelSchema of a .pbit — docs/FORMAT-NOTES.md seção 6. Not
 * zod-validated — the parser degrades to a Diagnostic instead of throwing
 * when these shapes don't hold (spec principle: "degradação honesta").
 *
 * `expression` fields (measure, calculated column, M partition source) come
 * either as a plain string or as an array of one string per line — both are
 * modeled here and joined with "\n" by the parser.
 */

export type RawTmslExpression = string | string[];

export type RawColumn = {
  name?: string;
  dataType?: string;
  type?: "calculated" | string;
  expression?: RawTmslExpression;
  isHidden?: boolean;
};

export type RawMeasure = {
  name?: string;
  expression?: RawTmslExpression;
  formatString?: string;
};

export type RawPartitionSource = {
  type?: string;
  expression?: RawTmslExpression;
};

export type RawPartition = {
  name?: string;
  source?: RawPartitionSource;
};

export type RawTable = {
  name?: string;
  isHidden?: boolean;
  columns?: RawColumn[];
  measures?: RawMeasure[];
  partitions?: RawPartition[];
};

export type RawRelationship = {
  fromTable?: string;
  fromColumn?: string;
  toTable?: string;
  toColumn?: string;
  fromCardinality?: "none" | "one" | "many" | string;
  toCardinality?: "none" | "one" | "many" | string;
  crossFilteringBehavior?: "oneDirection" | "bothDirections" | "automatic" | string;
  isActive?: boolean;
};

export type RawModel = {
  tables?: RawTable[];
  relationships?: RawRelationship[];
};

export type RawDataModelSchema = {
  name?: string;
  compatibilityLevel?: number;
  model?: RawModel;
};
