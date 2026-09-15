export { CORE_VERSION } from "./version.js";
export * from "./ir/index.js";
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
export { runHealthChecks, HEALTH_CHECK_RULES, type HealthCheckRule } from "./rules/index.js";
