import type { CanvasApp } from "../ir/index.js";
import { diffControl } from "./diff-control.js";
import { diffKeyedArray, diffPrimitive, type DiffEntry } from "./diff-utils.js";

export function diffCanvasApp(before: CanvasApp, after: CanvasApp): DiffEntry[] {
  const entries: DiffEntry[] = [];

  diffPrimitive("appVersion", before.appVersion, after.appVersion, entries);
  diffPrimitive("onStart.raw", before.onStart?.raw, after.onStart?.raw, entries);

  diffKeyedArray(
    "screens",
    before.screens,
    after.screens,
    (screen) => screen.name,
    (path, b, a, e) => {
      diffPrimitive(`${path}.order`, b.order, a.order, e);
      diffControl(`${path}.root`, b.root, a.root, e);
    },
    entries,
  );

  diffKeyedArray(
    "components",
    before.components,
    after.components,
    (component) => component.name,
    (path, b, a, e) => diffControl(`${path}.root`, b.root, a.root, e),
    entries,
  );

  diffKeyedArray(
    "dataSources",
    before.dataSources,
    after.dataSources,
    (dataSource) => dataSource.name,
    (path, b, a, e) => {
      diffPrimitive(`${path}.type`, b.type, a.type, e);
      diffPrimitive(`${path}.connectorId`, b.connectorId, a.connectorId, e);
    },
    entries,
  );

  diffKeyedArray(
    "variables",
    before.variables,
    after.variables,
    (variable) => variable.name,
    (path, b, a, e) => diffPrimitive(`${path}.kind`, b.kind, a.kind, e),
    entries,
  );

  return entries;
}
