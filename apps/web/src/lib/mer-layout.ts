import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { DataModel, ModelTable, Relationship } from "@power-lens/core";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { loadPositions, type TablePosition } from "./mer-positions";

const elk = new ELK();

export const TABLE_NODE_WIDTH = 260;
export const TABLE_HEADER_HEIGHT = 44;
export const TABLE_COLUMN_ROW_HEIGHT = 22;

/**
 * Mais de um relacionamento pode ligar o mesmo par de tabelas (ex.: uma
 * tabela de fatos com duas colunas de data apontando pra uma mesma dimensão
 * de calendário) — um handle único por lado faria as arestas se sobreporem
 * exatamente e virarem indistinguíveis. TableNode.tsx renderiza esse tanto
 * de handles em cada lado; `assignHandleSlots` abaixo decide qual cada
 * aresta usa.
 */
export const HANDLE_SLOT_COUNT = 3;

export type MerRfNodeData = {
  table: ModelTable;
  expanded: boolean;
};

function tableNodeHeight(table: ModelTable, expanded: boolean): number {
  if (!expanded) return TABLE_HEADER_HEIGHT;
  return TABLE_HEADER_HEIGHT + Math.max(table.columns.length, 1) * TABLE_COLUMN_ROW_HEIGHT + 12;
}

/**
 * Deriva ponta/símbolo de cada lado de um relacionamento a partir da
 * cardinalidade do IR, e normaliza a direção da aresta pra sempre fluir do
 * lado "1" pro lado "*" (o sentido natural de filtragem em um schema
 * estrela: dimensão -> fato) — independente de qual lado é `from`/`to` no
 * TMSL original.
 */
function relationshipEdgeShape(rel: Relationship): {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
} {
  switch (rel.cardinality) {
    case "oneToMany":
      return { source: rel.from.table, target: rel.to.table, sourceLabel: "1", targetLabel: "*" };
    case "manyToOne":
      return { source: rel.to.table, target: rel.from.table, sourceLabel: "1", targetLabel: "*" };
    case "oneToOne":
      return { source: rel.from.table, target: rel.to.table, sourceLabel: "1", targetLabel: "1" };
    case "manyToMany":
      return { source: rel.from.table, target: rel.to.table, sourceLabel: "*", targetLabel: "*" };
  }
}

function buildEdge(rel: Relationship, index: number, handleSlot: number): Edge {
  const { source, target, sourceLabel, targetLabel } = relationshipEdgeShape(rel);
  const id = `${rel.from.table}.${rel.from.column}->${rel.to.table}.${rel.to.column}#${index}`;
  const slotSuffix = `-${handleSlot % HANDLE_SLOT_COUNT}`;

  return {
    id,
    source,
    target,
    sourceHandle: `source${slotSuffix}`,
    targetHandle: `target${slotSuffix}`,
    label: `${sourceLabel} : ${targetLabel}`,
    labelBgPadding: [4, 2],
    labelStyle: { fontSize: 11 },
    style: {
      strokeDasharray: rel.isActive ? undefined : "5 4",
      opacity: rel.isActive ? 1 : 0.55,
    },
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    ...(rel.crossFilter === "both" ? { markerStart: { type: MarkerType.ArrowClosed, width: 16, height: 16 } } : {}),
  };
}

/** Cada par de tabelas ganha um contador próprio, então a 2ª/3ª aresta entre
 * as mesmas duas tabelas usa um handle diferente (ver HANDLE_SLOT_COUNT). */
function assignHandleSlots(relationships: readonly Relationship[]): number[] {
  const seen = new Map<string, number>();
  return relationships.map((rel) => {
    const pairKey = [rel.from.table, rel.to.table].sort().join("|");
    const slot = seen.get(pairKey) ?? 0;
    seen.set(pairKey, slot + 1);
    return slot;
  });
}

export async function layoutModel(
  model: DataModel,
  expanded: ReadonlySet<string>,
): Promise<{ nodes: Node<MerRfNodeData>[]; edges: Edge[] }> {
  const handleSlots = assignHandleSlots(model.relationships);
  const edges = model.relationships.map((rel, index) => buildEdge(rel, index, handleSlots[index]!));

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "56",
      "elk.layered.spacing.nodeNodeBetweenLayers": "96",
      "elk.layered.spacing.edgeNodeBetweenLayers": "32",
    },
    children: model.tables.map((table) => {
      const isExpanded = expanded.has(table.name);
      return { id: table.name, width: TABLE_NODE_WIDTH, height: tableNodeHeight(table, isExpanded) };
    }),
    edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };

  const laidOut = await elk.layout(elkGraph);
  const storedPositions = loadPositions(model.id);

  const nodes: Node<MerRfNodeData>[] = (laidOut.children ?? []).map((child) => {
    const table = model.tables.find((t) => t.name === child.id)!;
    const isExpanded = expanded.has(table.name);
    const stored: TablePosition | undefined = storedPositions[table.name];

    return {
      id: table.name,
      type: "tableNode",
      position: stored ?? { x: child.x ?? 0, y: child.y ?? 0 },
      style: { width: TABLE_NODE_WIDTH, height: tableNodeHeight(table, isExpanded) },
      data: { table, expanded: isExpanded },
    };
  });

  return { nodes, edges };
}
