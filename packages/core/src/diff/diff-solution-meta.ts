import type { SolutionMeta } from "../ir/index.js";
import { diffPrimitive, type DiffEntry } from "./diff-utils.js";

export function diffSolutionMeta(before: SolutionMeta, after: SolutionMeta): DiffEntry[] {
  const entries: DiffEntry[] = [];
  diffPrimitive("version", before.version, after.version, entries);
  diffPrimitive("publisher", before.publisher, after.publisher, entries);
  return entries;
}
