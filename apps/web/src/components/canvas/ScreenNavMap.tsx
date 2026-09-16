import { useEffect, useRef, useState } from "react";
import { Background, Controls, ReactFlow, type Edge, type Node, type NodeTypes, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import type { CanvasApp } from "@power-lens/core";
import { layoutScreenNavigation, type ScreenNavNodeData } from "@/lib/screen-nav-layout";
import { ScreenNavNode } from "./ScreenNavNode";

const nodeTypes: NodeTypes = { screenNavNode: ScreenNavNode };

type ScreenNavMapProps = { app: CanvasApp };

/**
 * Mapa de navegação entre telas (Fase 11) — mesma fonte de dado que PL001
 * usa pra decidir tela órfã (`buildScreenNavigationGraph`, núcleo), agora
 * visualizada como grafo em vez de só contada. Sem direção alternável nem
 * collapse: é um grafo pequeno e plano, não precisa dos controles do DAG de
 * fluxo.
 */
export function ScreenNavMap({ app }: ScreenNavMapProps) {
  const { resolvedTheme } = useTheme();
  const [nodes, setNodes] = useState<Node<ScreenNavNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const rfInstanceRef = useRef<ReactFlowInstance<Node<ScreenNavNodeData>, Edge> | null>(null);

  useEffect(() => {
    let cancelled = false;
    layoutScreenNavigation(app).then((result) => {
      if (cancelled) return;
      setNodes(result.nodes);
      setEdges(result.edges);
    });
    return () => {
      cancelled = true;
    };
  }, [app]);

  useEffect(() => {
    rfInstanceRef.current?.fitView({ padding: 0.2 });
  }, [nodes]);

  return (
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
  );
}
