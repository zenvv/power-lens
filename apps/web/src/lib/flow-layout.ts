import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { CloudFlow, FlowNode } from "@power-lens/core";
import type { Edge, Node } from "@xyflow/react";

const elk = new ELK();

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 60;
export const GROUP_HEADER_HEIGHT = 40;

const GROUP_LAYOUT_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.spacing.nodeNode": "28",
  "elk.layered.spacing.nodeNodeBetweenLayers": "40",
  "elk.padding": `[top=${GROUP_HEADER_HEIGHT + 16},left=16,bottom=16,right=16]`,
} as const;

export type FlowRfNodeData = {
  flowNode: FlowNode;
  isGroup: boolean;
  collapsed: boolean;
  childCount: number;
};

type PlainEdge = { id: string; source: string; target: string; statuses: string[] };

function groupByParent(actions: readonly FlowNode[]): Map<string | undefined, FlowNode[]> {
  const map = new Map<string | undefined, FlowNode[]>();
  for (const action of actions) {
    const list = map.get(action.parentId) ?? [];
    list.push(action);
    map.set(action.parentId, list);
  }
  return map;
}

function buildElkNode(
  flowNode: FlowNode,
  byParent: Map<string | undefined, FlowNode[]>,
  collapsed: ReadonlySet<string>,
  edgesOut: PlainEdge[],
): ElkNode {
  const children = byParent.get(flowNode.id) ?? [];
  const isGroup = children.length > 0;
  const isCollapsed = isGroup && collapsed.has(flowNode.id);

  if (!isGroup || isCollapsed) {
    return { id: flowNode.id, width: NODE_WIDTH, height: NODE_HEIGHT };
  }

  const localEdges: ElkExtendedEdge[] = [];
  for (const child of children) {
    for (const runAfter of child.runAfter) {
      if (children.some((c) => c.id === runAfter.id)) {
        const id = `${runAfter.id}->${child.id}`;
        localEdges.push({ id, sources: [runAfter.id], targets: [child.id] });
        edgesOut.push({ id, source: runAfter.id, target: child.id, statuses: runAfter.statuses });
      }
    }
  }

  return {
    id: flowNode.id,
    layoutOptions: GROUP_LAYOUT_OPTIONS,
    children: children.map((child) => buildElkNode(child, byParent, collapsed, edgesOut)),
    edges: localEdges,
  };
}

function collectRfNodes(
  elkNode: ElkNode,
  parentId: string | undefined,
  flowNodesById: Map<string, FlowNode>,
  byParent: Map<string | undefined, FlowNode[]>,
  collapsed: ReadonlySet<string>,
  out: Node<FlowRfNodeData>[],
): void {
  for (const child of elkNode.children ?? []) {
    const flowNode = flowNodesById.get(child.id);
    if (!flowNode) continue;

    const childActions = byParent.get(child.id) ?? [];
    const isGroup = childActions.length > 0;

    out.push({
      id: child.id,
      type: "flowNode",
      position: { x: child.x ?? 0, y: child.y ?? 0 },
      ...(parentId ? { parentId, extent: "parent" as const } : {}),
      draggable: false,
      selectable: false,
      style: { width: child.width, height: child.height },
      data: {
        flowNode,
        isGroup,
        collapsed: isGroup && collapsed.has(child.id),
        childCount: childActions.length,
      },
    });

    if (child.children) {
      collectRfNodes(child, child.id, flowNodesById, byParent, collapsed, out);
    }
  }
}

export async function layoutFlow(
  flow: CloudFlow,
  collapsed: ReadonlySet<string>,
): Promise<{ nodes: Node<FlowRfNodeData>[]; edges: Edge[] }> {
  const byParent = groupByParent(flow.actions);
  const topLevel = byParent.get(undefined) ?? [];

  const flowNodesById = new Map<string, FlowNode>([[flow.trigger.id, flow.trigger]]);
  for (const action of flow.actions) flowNodesById.set(action.id, action);

  const edgesOut: PlainEdge[] = [];
  const rootLocalEdges: ElkExtendedEdge[] = [];

  for (const action of topLevel) {
    if (action.runAfter.length === 0) {
      const id = `${flow.trigger.id}->${action.id}`;
      rootLocalEdges.push({ id, sources: [flow.trigger.id], targets: [action.id] });
      edgesOut.push({ id, source: flow.trigger.id, target: action.id, statuses: [] });
      continue;
    }
    for (const runAfter of action.runAfter) {
      const id = `${runAfter.id}->${action.id}`;
      rootLocalEdges.push({ id, sources: [runAfter.id], targets: [action.id] });
      edgesOut.push({ id, source: runAfter.id, target: action.id, statuses: runAfter.statuses });
    }
  }

  const rootGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "48",
      "elk.layered.spacing.nodeNodeBetweenLayers": "64",
    },
    children: [
      { id: flow.trigger.id, width: NODE_WIDTH, height: NODE_HEIGHT },
      ...topLevel.map((action) => buildElkNode(action, byParent, collapsed, edgesOut)),
    ],
    edges: rootLocalEdges,
  };

  const laidOut = await elk.layout(rootGraph);

  // The root graph's children already include the trigger (first entry) and
  // every top-level action, so one recursive walk covers the whole tree.
  const nodes: Node<FlowRfNodeData>[] = [];
  collectRfNodes(laidOut, undefined, flowNodesById, byParent, collapsed, nodes);

  const edges: Edge[] = edgesOut.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label:
      edge.statuses.length > 0 && !(edge.statuses.length === 1 && edge.statuses[0] === "Succeeded")
        ? edge.statuses.join(", ")
        : undefined,
    animated: false,
  }));

  return { nodes, edges };
}
