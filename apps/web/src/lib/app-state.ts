import type { Diagnostic } from "@power-lens/core";
import type { AnalysisResult } from "./analyze.js";

export type AppState =
  | { status: "idle" }
  | { status: "loading"; fileName: string; stage: string }
  | { status: "unrecognized"; fileName: string; diagnostics: Diagnostic[] }
  | { status: "parsed"; result: Extract<AnalysisResult, { status: "parsed" }> };
