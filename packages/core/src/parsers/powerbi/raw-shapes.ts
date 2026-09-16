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

/**
 * Loose shapes for Report/Layout, verificado contra um `.pbit` real
 * (`reference/pbi-file-example.pbit`, gitignored — docs/FORMAT-NOTES.md
 * seção 6). Cada `visualContainers[].config` é uma STRING JSON (precisa de
 * um segundo `JSON.parse`), não um objeto direto. Um visual de verdade tem
 * `singleVisual`; um container de agrupamento (caixa decorativa sem dado)
 * tem `singleVisualGroup` no lugar e é ignorado pelo parser — não é um
 * "visual" no sentido de `Report.pages[].visuals[]` do IR.
 */
export type RawVisualQuerySelect = { Name?: string };

export type RawVisualLiteralExpr = { Literal?: { Value?: string } };

export type RawVisualObjectProperty = { properties?: { text?: { expr?: RawVisualLiteralExpr } } };

export type RawSingleVisual = {
  visualType?: string;
  prototypeQuery?: { Select?: RawVisualQuerySelect[] };
  objects?: { title?: RawVisualObjectProperty[] };
};

export type RawVisualContainerConfig = {
  singleVisual?: RawSingleVisual;
  singleVisualGroup?: { displayName?: string };
};

export type RawVisualContainer = {
  /** JSON serializado — ver comentário do módulo. */
  config?: string;
};

export type RawReportSection = {
  name?: string;
  displayName?: string;
  ordinal?: number;
  visualContainers?: RawVisualContainer[];
};

export type RawReportLayout = {
  sections?: RawReportSection[];
};
