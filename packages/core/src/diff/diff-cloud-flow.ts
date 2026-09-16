import type { CloudFlow, FlowNode } from "../ir/index.js";
import { diffKeyedArray, diffPlain, diffPrimitive, type DiffEntry } from "./diff-utils.js";

function diffFlowNode(path: string, before: FlowNode, after: FlowNode, entries: DiffEntry[]): void {
  diffPrimitive(`${path}.type`, before.type, after.type, entries);
  diffPrimitive(`${path}.connectorName`, before.connectorName, after.connectorName, entries);
  diffPrimitive(`${path}.parentId`, before.parentId, after.parentId, entries);
  diffPrimitive(`${path}.branch`, before.branch, after.branch, entries);
  diffPrimitive(`${path}.condition`, before.condition, after.condition, entries);
  diffPrimitive(`${path}.iterateOver`, before.iterateOver, after.iterateOver, entries);
  diffPlain(`${path}.runAfter`, before.runAfter, after.runAfter, entries);
  diffPlain(`${path}.inputs`, before.inputs, after.inputs, entries);
  diffPlain(`${path}.recurrence`, before.recurrence, after.recurrence, entries);
}

/** `actions` casado por `id` (a própria chave do Workflow Definition
 * Language, estável entre saves — diferente do id sintético de uma
 * `Screen`/`Control`). `trigger` é sempre comparado, não casado por chave —
 * um `CloudFlow` tem exatamente um. */
export function diffCloudFlow(before: CloudFlow, after: CloudFlow): DiffEntry[] {
  const entries: DiffEntry[] = [];

  diffFlowNode("trigger", before.trigger, after.trigger, entries);
  diffKeyedArray("actions", before.actions, after.actions, (node) => node.id, diffFlowNode, entries);
  diffKeyedArray(
    "connections",
    before.connections,
    after.connections,
    (connection) => connection.name,
    (path, b, a, e) => diffPrimitive(`${path}.connectorName`, b.connectorName, a.connectorName, e),
    entries,
  );

  return entries;
}
