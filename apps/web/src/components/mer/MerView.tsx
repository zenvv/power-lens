import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import type { DataModel } from "@power-lens/core";
import { layoutModel, type MerRfNodeData } from "@/lib/mer-layout";
import { savePosition } from "@/lib/mer-positions";
import { TableNode, type MerRfNodeDataWithToggle } from "./TableNode";

const nodeTypes: NodeTypes = { tableNode: TableNode };

type MerViewProps = {
  model: DataModel;
};

export function MerView({ model }: MerViewProps) {
  const { resolvedTheme } = useTheme();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(model.tables.map((t) => t.name)));
  const [nodes, setNodes] = useState<Node<MerRfNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onToggle = useCallback((tableName: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) next.delete(tableName);
      else next.add(tableName);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    layoutModel(model, expanded)
      .then((result) => {
        if (cancelled) return;
        setNodes(result.nodes);
        setEdges(result.edges);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [model, expanded]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<MerRfNodeData>>[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev));

      // Persiste só quando o arrasto termina (dragging: false), não a cada
      // frame do gesto — spec seção 7: "arrasto manual persistido em localStorage".
      for (const change of changes) {
        if (change.type === "position" && change.position && change.dragging === false) {
          savePosition(model.id, change.id, change.position);
        }
      }
    },
    [model.id],
  );

  const nodesWithToggle = useMemo<Node<MerRfNodeDataWithToggle>[]>(
    () => nodes.map((node) => ({ ...node, data: { ...node.data, onToggle } })),
    [nodes, onToggle],
  );

  // TODO: exportar este diagrama como PNG/SVG. Mesmo pedido do FlowDagView —
  // resolver os dois juntos com a mesma abordagem quando for implementado.
  return (
    <div style={{ height: "70vh" }} className="rounded-lg border bg-background/50">
      <ReactFlow
        nodes={nodesWithToggle}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
