export { CORE_VERSION } from "./version.js";
export * from "./ir/index.js";
export { parseMsapp, type MsappSource } from "./parsers/msapp/index.js";
export { parseSolution, type SolutionSource } from "./parsers/solution/index.js";
export { parseFlow, type FlowSource } from "./parsers/flow/index.js";
export { detectFormat, type DetectionResult } from "./detect/index.js";
export { renderMarkdown, buildContextPack } from "./render/index.js";
