import { z } from "zod";

/**
 * schemaVersion policy: bump this literal only when an existing field's shape
 * or meaning changes in a way that breaks a consumer parsing an older
 * document (removing a field, changing a type, renaming a key). Adding a new
 * optional field, or a new Artifact/Diagnostic variant, does not require a
 * bump — the schema is additive-friendly by default so renderers written
 * against 0.1 keep working as the IR grows.
 */
export const SCHEMA_VERSION = "0.1" as const;

export const SourceFormatSchema = z.enum([
  "msapp",
  "solution",
  "flow",
  "pbit",
  "pbip",
  "pbix",
]);
export type SourceFormat = z.infer<typeof SourceFormatSchema>;

export const SourceSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().nonnegative(),
  detectedFormat: SourceFormatSchema,
  parsedAt: z.iso.datetime(),
  parserVersion: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;

export const DiagnosticSeveritySchema = z.enum(["error", "warning", "info"]);
export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;

export const DiagnosticSchema = z.object({
  code: z.string(),
  severity: DiagnosticSeveritySchema,
  message: z.string(),
  artifactId: z.string().optional(),
  path: z.string().optional(),
  hint: z.string().optional(),
});
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

// ── Expressions & references ──────────────────────────────────────────────

export const ReferenceKindSchema = z.enum([
  "control",
  "dataSource",
  "variable",
  "collection",
  "function",
  "screen",
]);
export type ReferenceKind = z.infer<typeof ReferenceKindSchema>;

export const ReferenceSchema = z.object({
  kind: ReferenceKindSchema,
  name: z.string(),
});
export type Reference = z.infer<typeof ReferenceSchema>;

export const ExpressionSchema = z.object({
  raw: z.string(),
  kind: z.enum(["literal", "formula"]),
  literal: z.union([z.string(), z.number(), z.boolean()]).optional(),
  references: z.array(ReferenceSchema),
});
export type Expression = z.infer<typeof ExpressionSchema>;

// ── Control tree ─────────────────────────────────────────────────────────
// Control is self-referential (children: Control[]), which zod can't infer
// through z.lazy() alone — the shape below is spelled out once so z.infer
// can resolve it, then re-exported as the single source of truth.

type ControlShape = {
  name: string;
  type: string;
  properties: Record<string, Expression>;
  children: ControlShape[];
};

export const ControlSchema: z.ZodType<ControlShape> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.string(),
    properties: z.record(z.string(), ExpressionSchema),
    children: z.array(ControlSchema),
  }),
);
export type Control = z.infer<typeof ControlSchema>;

export const ScreenSchema = z.object({
  name: z.string(),
  order: z.number().int().nonnegative(),
  root: ControlSchema,
});
export type Screen = z.infer<typeof ScreenSchema>;

/**
 * Not defined in SPEC.md section 5 (CanvasApp.components references this
 * type without a definition). Modeled on Screen + the ComponentDefinitions
 * shape confirmed in docs/FORMAT-NOTES.md section 1.3 — a component has its
 * own Properties/Children tree, same as a screen, but no `order`. Revisit
 * once the msapp component parser is implemented.
 */
export const ComponentSchema = z.object({
  name: z.string(),
  root: ControlSchema,
});
export type Component = z.infer<typeof ComponentSchema>;

/**
 * Not defined in SPEC.md section 5 (CanvasApp.dataSources references this
 * type without a definition). Kept deliberately minimal — see
 * docs/FORMAT-NOTES.md section 1.6/1.7 for the richer shape a real
 * References/DataSources.json + Properties.json carry (site URL can differ
 * per data source even within one connection). Expand when the msapp parser
 * needs more than name + a coarse type.
 */
export const DataSourceSchema = z.object({
  name: z.string(),
  type: z.string(),
});
export type DataSource = z.infer<typeof DataSourceSchema>;

/**
 * Not defined in SPEC.md section 5 (CanvasApp.variables references this type
 * without a definition). Per spec prose: "inferido de Set/UpdateContext/
 * Collect".
 */
export const VariableUsageSchema = z.object({
  name: z.string(),
  kind: z.enum(["variable", "collection", "contextVariable"]),
});
export type VariableUsage = z.infer<typeof VariableUsageSchema>;

export const CanvasAppSchema = z.object({
  kind: z.literal("canvasApp"),
  id: z.string(),
  name: z.string(),
  appVersion: z.string().optional(),
  screens: z.array(ScreenSchema),
  components: z.array(ComponentSchema),
  dataSources: z.array(DataSourceSchema),
  variables: z.array(VariableUsageSchema),
  theme: z.record(z.string(), z.string()).optional(),
  /**
   * Added after the initial spec draft — Src/App.pa.yaml's own OnStart had
   * nowhere to live (FORMAT-NOTES.md section 5.1), which matters for the
   * future PL005 health check rule ("OnStart acima de N linhas"). `theme`
   * above is left untouched: the spec never clarified whether it means the
   * raw Theme formula or a resolved palette, and this only had evidence for
   * OnStart.
   */
  onStart: ExpressionSchema.optional(),
});
export type CanvasApp = z.infer<typeof CanvasAppSchema>;

// ── Cloud Flow ───────────────────────────────────────────────────────────

export const RunAfterSchema = z.object({
  id: z.string(),
  statuses: z.array(z.string()),
});
export type RunAfter = z.infer<typeof RunAfterSchema>;

export const FlowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  connectorName: z.string().optional(),
  parentId: z.string().optional(),
  runAfter: z.array(RunAfterSchema),
  summary: z.string().optional(),
});
export type FlowNode = z.infer<typeof FlowNodeSchema>;

/**
 * Not defined in SPEC.md section 5 (CloudFlow.connections references this
 * type without a definition). docs/FORMAT-NOTES.md section 4 flags that no
 * real flow definition.json has been inspected yet — expand once one is
 * available.
 */
export const ConnectionRefSchema = z.object({
  name: z.string(),
  connectorName: z.string().optional(),
});
export type ConnectionRef = z.infer<typeof ConnectionRefSchema>;

export const CloudFlowSchema = z.object({
  kind: z.literal("cloudFlow"),
  id: z.string(),
  name: z.string(),
  trigger: FlowNodeSchema,
  actions: z.array(FlowNodeSchema),
  connections: z.array(ConnectionRefSchema),
});
export type CloudFlow = z.infer<typeof CloudFlowSchema>;

// ── Data model ───────────────────────────────────────────────────────────

export const ModelColumnSchema = z.object({
  name: z.string(),
  dataType: z.string(),
  isCalculated: z.boolean(),
  expression: z.string().optional(),
});
export type ModelColumn = z.infer<typeof ModelColumnSchema>;

export const ModelTableSchema = z.object({
  name: z.string(),
  columns: z.array(ModelColumnSchema),
  sourceExpression: z.string().optional(),
  isHidden: z.boolean().optional(),
});
export type ModelTable = z.infer<typeof ModelTableSchema>;

export const RelationshipEndSchema = z.object({
  table: z.string(),
  column: z.string(),
});
export type RelationshipEnd = z.infer<typeof RelationshipEndSchema>;

export const RelationshipSchema = z.object({
  from: RelationshipEndSchema,
  to: RelationshipEndSchema,
  cardinality: z.enum(["oneToMany", "manyToOne", "oneToOne", "manyToMany"]),
  crossFilter: z.enum(["single", "both"]),
  isActive: z.boolean(),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const MeasureSchema = z.object({
  name: z.string(),
  table: z.string(),
  expression: z.string(),
  formatString: z.string().optional(),
});
export type Measure = z.infer<typeof MeasureSchema>;

export const DataModelSchema = z.object({
  kind: z.literal("dataModel"),
  id: z.string(),
  name: z.string(),
  tables: z.array(ModelTableSchema),
  relationships: z.array(RelationshipSchema),
  measures: z.array(MeasureSchema),
});
export type DataModel = z.infer<typeof DataModelSchema>;

// ── Report ───────────────────────────────────────────────────────────────

export const VisualSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  fields: z.array(z.string()),
});
export type Visual = z.infer<typeof VisualSchema>;

export const ReportPageSchema = z.object({
  name: z.string(),
  order: z.number().int().nonnegative(),
  visuals: z.array(VisualSchema),
});
export type ReportPage = z.infer<typeof ReportPageSchema>;

export const ReportSchema = z.object({
  kind: z.literal("report"),
  id: z.string(),
  name: z.string(),
  pages: z.array(ReportPageSchema),
});
export type Report = z.infer<typeof ReportSchema>;

// ── Solution metadata ───────────────────────────────────────────────────
// Referenced by the Artifact union in SPEC.md section 5 but never defined
// there. docs/FORMAT-NOTES.md section 2 flags that solution.zip internals
// are unverified against a real file — kept minimal on purpose.

export const SolutionMetaSchema = z.object({
  kind: z.literal("solutionMeta"),
  id: z.string(),
  name: z.string(),
  version: z.string().optional(),
  publisher: z.string().optional(),
});
export type SolutionMeta = z.infer<typeof SolutionMetaSchema>;

// ── Artifact union & document ────────────────────────────────────────────

export const ArtifactSchema = z.discriminatedUnion("kind", [
  CanvasAppSchema,
  CloudFlowSchema,
  DataModelSchema,
  ReportSchema,
  SolutionMetaSchema,
]);
export type Artifact = z.infer<typeof ArtifactSchema>;

export const PowerLensDocumentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  source: SourceSchema,
  artifacts: z.array(ArtifactSchema),
  diagnostics: z.array(DiagnosticSchema),
});
export type PowerLensDocument = z.infer<typeof PowerLensDocumentSchema>;
