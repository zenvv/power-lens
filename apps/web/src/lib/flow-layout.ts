import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { CloudFlow, FlowNode } from "@power-lens/core";
import type { Edge, Node } from "@xyflow/react";

const elk = new ELK();

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 60;
export const GROUP_HEADER_HEIGHT = 40;

/** Sentido do DAG: "DOWN" (padrão, cima pra baixo) ou "RIGHT" (esquerda pra
 * direita) — passado direto pro `elk.direction` do ELK, que já suporta os
 * dois nativamente. */
export type FlowDirection = "DOWN" | "RIGHT";

function groupLayoutOptions(direction: FlowDirection) {
  return {
    "elk.algorithm": "layered",
    "elk.direction": direction,
    "elk.spacing.nodeNode": "28",
    "elk.layered.spacing.nodeNodeBetweenLayers": "40",
    // O cabeçalho do grupo (chevron + nome) sempre fica na faixa de cima da
    // caixa, independente do sentido do fluxo dos filhos — por isso o
    // padding-top reservado pro header não muda com a direção.
    "elk.padding": `[top=${GROUP_HEADER_HEIGHT + 16},left=16,bottom=16,right=16]`,
  } as const;
}

export type FlowRfNodeData = {
  flowNode: FlowNode;
  isGroup: boolean;
  collapsed: boolean;
  childCount: number;
  direction: FlowDirection;
  isTrigger: boolean;
  isEnd: boolean;
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
  direction: FlowDirection,
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
    layoutOptions: groupLayoutOptions(direction),
    children: children.map((child) => buildElkNode(child, byParent, collapsed, edgesOut, direction)),
    edges: localEdges,
  };
}

function collectRfNodes(
  elkNode: ElkNode,
  parentId: string | undefined,
  flowNodesById: Map<string, FlowNode>,
  byParent: Map<string | undefined, FlowNode[]>,
  collapsed: ReadonlySet<string>,
  direction: FlowDirection,
  triggerId: string,
  endIds: ReadonlySet<string>,
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
        direction,
        isTrigger: child.id === triggerId,
        isEnd: endIds.has(child.id),
      },
    });

    if (child.children) {
      collectRfNodes(child, child.id, flowNodesById, byParent, collapsed, direction, triggerId, endIds, out);
    }
  }
}

/** Uma action é "fim" de fluxo quando nenhuma outra action roda depois dela
 * (não aparece como `runAfter` de ninguém) — pode haver mais de uma, uma por
 * ramo (branch de If/Switch, por exemplo). O gatilho nunca conta como fim. */
function findEndIds(flow: CloudFlow): Set<string> {
  const referenced = new Set(flow.actions.flatMap((a) => a.runAfter.map((r) => r.id)));
  return new Set(flow.actions.filter((a) => !referenced.has(a.id)).map((a) => a.id));
}

export async function layoutFlow(
  flow: CloudFlow,
  collapsed: ReadonlySet<string>,
  direction: FlowDirection = "DOWN",
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
      "elk.direction": direction,
      "elk.spacing.nodeNode": "48",
      "elk.layered.spacing.nodeNodeBetweenLayers": "64",
    },
    children: [
      { id: flow.trigger.id, width: NODE_WIDTH, height: NODE_HEIGHT },
      ...topLevel.map((action) => buildElkNode(action, byParent, collapsed, edgesOut, direction)),
    ],
    edges: rootLocalEdges,
  };

  const laidOut = await elk.layout(rootGraph);

  // The root graph's children already include the trigger (first entry) and
  // every top-level action, so one recursive walk covers the whole tree.
  const nodes: Node<FlowRfNodeData>[] = [];
  const endIds = findEndIds(flow);
  collectRfNodes(laidOut, undefined, flowNodesById, byParent, collapsed, direction, flow.trigger.id, endIds, nodes);

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
