import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { Artifact, PowerLensDocument } from "@power-lens/core";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { shortArtifactName } from "./artifact-name";

const elk = new ELK();

export const DEPENDENCY_NODE_WIDTH = 220;
export const DEPENDENCY_NODE_HEIGHT = 56;

export type DependencyRfNodeData = { label: string; fullName: string; kind: Artifact["kind"] };

export type DependencyRfEdgeData = {
  fromLabel: string;
  toKind: string;
  confidence: "exact" | "heuristic";
};

/**
 * Layout do grafo de dependência entre artefatos de uma solution (Fase 13)
 * — mesmo molde de `mer-layout.ts`/`flow-layout.ts` (elkjs "layered"). Um nó
 * por artefato referenciado em alguma `DependencyEdge` (não um nó por
 * artefato do documento inteiro — um `CanvasApp`/`CloudFlow`/`DataModel`
 * sem nenhum vínculo encontrado não aparece aqui, já que não tem aresta
 * nenhuma pra desenhar), uma aresta por `DependencyEdge` — tracejada quando
 * `confidence === "heuristic"` (mesma convenção visual do MER pra
 * relacionamento inativo).
 */
export async function layoutDependencyGraph(
  document: PowerLensDocument,
): Promise<{ nodes: Node<DependencyRfNodeData>[]; edges: Edge<DependencyRfEdgeData>[] }> {
  const artifactById = new Map(document.artifacts.map((artifact) => [artifact.id, artifact]));

  const nodeIds = new Set<string>();
  for (const dependency of document.dependencies) {
    nodeIds.add(dependency.fromArtifactId);
    nodeIds.add(dependency.toArtifactId);
  }

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "56",
      "elk.layered.spacing.nodeNodeBetweenLayers": "96",
    },
    children: [...nodeIds].map((id) => ({ id, width: DEPENDENCY_NODE_WIDTH, height: DEPENDENCY_NODE_HEIGHT })),
    edges: document.dependencies.map((dependency, index) => ({
      id: `edge-${index}`,
      sources: [dependency.fromArtifactId],
      targets: [dependency.toArtifactId],
    })),
  };

  const laidOut = await elk.layout(elkGraph);

  const nodes: Node<DependencyRfNodeData>[] = (laidOut.children ?? []).map((child) => {
    const artifact = artifactById.get(child.id);
    return {
      id: child.id,
      type: "dependencyNode",
      position: { x: child.x ?? 0, y: child.y ?? 0 },
      style: { width: DEPENDENCY_NODE_WIDTH, height: DEPENDENCY_NODE_HEIGHT },
      data: {
        label: shortArtifactName(artifact?.name ?? child.id),
        fullName: artifact?.name ?? child.id,
        kind: artifact?.kind ?? "canvasApp",
      },
    };
  });

  const edges: Edge<DependencyRfEdgeData>[] = document.dependencies.map((dependency, index) => ({
    id: `edge-${index}`,
    source: dependency.fromArtifactId,
    target: dependency.toArtifactId,
    style: {
      strokeDasharray: dependency.confidence === "heuristic" ? "5 4" : undefined,
      opacity: dependency.confidence === "heuristic" ? 0.7 : 1,
    },
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    data: { fromLabel: dependency.from.name, toKind: dependency.toKind, confidence: dependency.confidence },
  }));

  return { nodes, edges };
}
