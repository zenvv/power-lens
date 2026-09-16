export { CORE_VERSION } from "./version.js";
export * from "./ir/index.js";
export { getMessages, DEFAULT_LOCALE, type Locale, type Messages } from "./i18n/index.js";
export { parseMsapp, type MsappSource } from "./parsers/msapp/index.js";
export { parseSolution, type SolutionSource } from "./parsers/solution/index.js";
export { parseFlow, type FlowSource } from "./parsers/flow/index.js";
export { parsePbit, type PbitSource } from "./parsers/powerbi/index.js";
export { detectFormat, type DetectionResult } from "./detect/index.js";
export {
  renderMarkdown,
  buildContextPack,
  buildPromptMd,
  resolveScreenLayout,
  resolveControlLayout,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from "./render/index.js";
export type { Resolved, ResolvedControl, ResolvedAutoLayout, LayoutContext } from "./render/index.js";
export {
  runHealthChecks,
  HEALTH_CHECK_RULES,
  RULE_REGISTRY,
  getRuleRegistry,
  type HealthCheckRule,
  type RuleOptions,
  type RuleOptionDef,
  type RuleDescriptor,
  type RuleConfig,
  type RuleConfigMap,
} from "./rules/index.js";
export { buildSearchIndex, searchIndex, type SearchEntry, type SearchEntryKind } from "./search/index.js";
export {
  buildLineageIndex,
  summarizeTrigger,
  buildScreenNavigationGraph,
  buildControlReferenceGraph,
  buildComponentInventory,
  APP_START_NODE,
  type LineageEntry,
  type LineageVisualRef,
  type TriggerSummary,
  type TriggerCategory,
  type ScreenNavigationGraph,
  type ScreenNavEdge,
  type ControlReferenceEdge,
  type ComponentUsage,
} from "./analysis/index.js";
export {
  diffDocuments,
  type ArtifactDiff,
  type ArtifactDiffStatus,
  type DocumentDiff,
  type DiffEntry,
} from "./diff/index.js";
