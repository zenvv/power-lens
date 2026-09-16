import { useEffect, useRef, useState } from "react";
import { Background, Controls, ReactFlow, type Edge, type Node, type NodeTypes, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import type { PowerLensDocument } from "@power-lens/core";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  layoutDependencyGraph,
  type DependencyRfEdgeData,
  type DependencyRfNodeData,
} from "@/lib/dependency-graph-layout";
import { DependencyNode } from "./DependencyNode";
import { useI18n } from "@/lib/i18n/context";

const nodeTypes: NodeTypes = { dependencyNode: DependencyNode };

type DependencyGraphViewProps = { document: PowerLensDocument };

/**
 * Grafo de dependência entre artefatos de uma solution (Fase 13) —
 * `document.dependencies` (núcleo) já traz tudo resolvido; esta view só
 * desenha. Rótulo da aresta já mostra "heurística" por extenso quando
 * `confidence !== "exact"` — ajuste de escopo em relação ao plano original
 * (tooltip de aresta trocado por texto sempre visível, mais simples que um
 * tipo de aresta customizado só pra isso).
 */
export function DependencyGraphView({ document }: DependencyGraphViewProps) {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes] = useState<Node<DependencyRfNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<DependencyRfEdgeData>[]>([]);
  const rfInstanceRef = useRef<ReactFlowInstance<Node<DependencyRfNodeData>, Edge<DependencyRfEdgeData>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    layoutDependencyGraph(document).then((result) => {
      if (cancelled) return;
      setNodes(result.nodes);
      setEdges(
        result.edges.map((edge) => {
          const toKindLabel = t.dependencies.toKindLabel[edgeToKindLabel(edge.data?.toKind ?? "table")];
          return {
            ...edge,
            label: edge.data?.confidence === "heuristic" ? `${toKindLabel} (${t.dependencies.heuristic})` : toKindLabel,
            labelBgPadding: [4, 2] as [number, number],
            labelStyle: { fontSize: 11 },
          };
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [document, t]);

  useEffect(() => {
    rfInstanceRef.current?.fitView({ padding: 0.2 });
  }, [nodes]);

  return (
    <TooltipProvider>
      <div style={{ height: "70vh" }} className="relative overflow-hidden rounded-lg border bg-background/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode={resolvedTheme === "dark" ? "dark" : "light"}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          elementsSelectable={false}
          nodesDraggable={false}
          onInit={(instance) => {
            rfInstanceRef.current = instance;
          }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </TooltipProvider>
  );
}

/** `toKind` do vínculo ("table"/"connection"/"flow") não é 1:1 com
 * `Artifact["kind"]` ("dataModel"/"cloudFlow"/...) — este mapa só existe
 * pra reusar o mesmo dicionário `dependencies.kindLabel` no rótulo da
 * aresta em vez de duplicar as três strings de novo. */
function edgeToKindLabel(toKind: string): "table" | "connection" | "flow" {
  return toKind === "table" || toKind === "connection" || toKind === "flow" ? toKind : "table";
}
