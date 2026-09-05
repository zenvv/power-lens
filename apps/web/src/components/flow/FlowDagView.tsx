import { useCallback, useEffect, useMemo, useState } from "react";
import { Background, Controls, ReactFlow, type Edge, type Node, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CloudFlow } from "@power-lens/core";
import { layoutFlow, type FlowRfNodeData } from "@/lib/flow-layout";
import { FlowNode, type FlowRfNodeDataWithToggle } from "./FlowNode";

const nodeTypes: NodeTypes = { flowNode: FlowNode };

type FlowDagViewProps = {
  flow: CloudFlow;
};

export function FlowDagView({ flow }: FlowDagViewProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [nodes, setNodes] = useState<Node<FlowRfNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onToggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    layoutFlow(flow, collapsed).then((result) => {
      if (cancelled) return;
      setNodes(result.nodes);
      setEdges(result.edges);
    });
    return () => {
      cancelled = true;
    };
  }, [flow, collapsed]);

  const nodesWithToggle = useMemo<Node<FlowRfNodeDataWithToggle>[]>(
    () => nodes.map((node) => ({ ...node, data: { ...node.data, onToggle } })),
    [nodes, onToggle],
  );

  return (
    <div style={{ height: "70vh" }} className="rounded-lg border bg-background/50">
      <ReactFlow
        nodes={nodesWithToggle}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
