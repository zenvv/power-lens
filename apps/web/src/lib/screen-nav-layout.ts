import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import { buildScreenNavigationGraph, type CanvasApp } from "@power-lens/core";
import { MarkerType, type Edge, type Node } from "@xyflow/react";

const elk = new ELK();

export const SCREEN_NODE_WIDTH = 180;
export const SCREEN_NODE_HEIGHT = 48;

export type ScreenNavNodeData = { label: string; isSynthetic: boolean };

/**
 * Layout do mapa de navegação entre telas (Fase 11) — mesmo molde de
 * `mer-layout.ts`/`flow-layout.ts` (elkjs "layered"), mas sem grupos nem
 * collapse: é um grafo pequeno e plano, um nó por tela referenciada
 * (incluindo o nó sintético "App" quando há navegação disparada em
 * `App.OnStart`) e uma aresta por par tela-origem/tela-destino, já somada
 * quando há mais de uma navegação pro mesmo par (`buildScreenNavigationGraph`
 * já devolve `count` agregado, não uma aresta por ocorrência).
 */
export async function layoutScreenNavigation(app: CanvasApp): Promise<{ nodes: Node<ScreenNavNodeData>[]; edges: Edge[] }> {
  const graph = buildScreenNavigationGraph(app);

  const nodeIds = new Set(graph.screens);
  for (const edge of graph.edges) {
    nodeIds.add(edge.from);
    nodeIds.add(edge.to);
  }

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "48",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
    },
    children: [...nodeIds].map((id) => ({ id, width: SCREEN_NODE_WIDTH, height: SCREEN_NODE_HEIGHT })),
    edges: graph.edges.map((edge, index) => ({ id: `edge-${index}`, sources: [edge.from], targets: [edge.to] })),
  };

  const laidOut = await elk.layout(elkGraph);

  const nodes: Node<ScreenNavNodeData>[] = (laidOut.children ?? []).map((child) => ({
    id: child.id,
    type: "screenNavNode",
    position: { x: child.x ?? 0, y: child.y ?? 0 },
    style: { width: SCREEN_NODE_WIDTH, height: SCREEN_NODE_HEIGHT },
    data: { label: child.id, isSynthetic: !graph.screens.includes(child.id) },
  }));

  const edges: Edge[] = graph.edges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.from,
    target: edge.to,
    label: edge.count > 1 ? String(edge.count) : undefined,
    labelBgPadding: [4, 2],
    labelStyle: { fontSize: 11 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }));

  return { nodes, edges };
}
