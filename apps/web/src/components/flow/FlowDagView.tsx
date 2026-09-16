import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { ArrowDown, ArrowRight } from "lucide-react";
import type { CloudFlow, FlowNode as FlowNodeIR } from "@power-lens/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import {
  layoutFlow,
  type FlowDirection,
  type FlowRfNodeData,
} from "@/lib/flow-layout";
import { FlowBranchNode } from "./FlowBranchNode";
import { FlowNode, type FlowRfNodeDataWithToggle } from "./FlowNode";
import { FlowNodeInspector } from "./FlowNodeInspector";

const nodeTypes: NodeTypes = { flowNode: FlowNode, flowBranch: FlowBranchNode };

type FlowDagViewProps = {
  flow: CloudFlow;
};

export function FlowDagView({ flow }: FlowDagViewProps) {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [nodes, setNodes] = useState<Node<FlowRfNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [direction, setDirection] = useState<FlowDirection>("DOWN");
  const rfInstanceRef = useRef<ReactFlowInstance<
    Node<FlowRfNodeDataWithToggle>,
    Edge
  > | null>(null);

  const onToggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  // Handler no nível do <ReactFlow>, não no componente do node: nodes com
  // `selectable`/`draggable` false só recebem eventos de ponteiro quando o
  // React Flow enxerga algum handler de clique registrado (senão a lib marca
  // o wrapper do node com `pointer-events: none` — otimização dela pra nodes
  // totalmente estáticos). Um onClick dentro do FlowNode nunca chegaria a
  // disparar nesse caso; por isso a seleção vive aqui, não lá.
  const onNodeClick = useCallback<NodeMouseHandler<Node<FlowRfNodeDataWithToggle>>>(
    (_event, node) => {
      if (node.data.kind !== "action" || node.data.isGroup) return;
      onSelect(node.id);
    },
    [onSelect],
  );

  const flowNodesById = useMemo<Map<string, FlowNodeIR>>(() => {
    const map = new Map<string, FlowNodeIR>([[flow.trigger.id, flow.trigger]]);
    for (const action of flow.actions) map.set(action.id, action);
    return map;
  }, [flow]);

  const selectedFlowNode = selectedId
    ? flowNodesById.get(selectedId)
    : undefined;

  useEffect(() => {
    let cancelled = false;
    layoutFlow(flow, collapsed, direction).then((result) => {
      if (cancelled) return;
      setNodes(result.nodes);
      setEdges(result.edges);
    });
    return () => {
      cancelled = true;
    };
  }, [flow, collapsed, direction]);

  // Recentraliza depois de qualquer mudança de layout (colapsar grupo,
  // trocar direção) — sem isso o novo formato do grafo pode ficar cortado
  // fora da viewport, já que `fitView` só roda sozinho na primeira carga.
  useEffect(() => {
    rfInstanceRef.current?.fitView({ padding: 0.2 });
  }, [nodes]);

  const nodesWithToggle = useMemo<Node<FlowRfNodeDataWithToggle>[]>(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onToggle,
          isSelected: node.id === selectedId,
        },
      })),
    [nodes, onToggle, selectedId],
  );

  // TODO: exportar este diagrama como PNG/SVG. Pedido do usuário depois de ver
  // o DAG renderizado — @xyflow/react tem getNodesBounds/getViewportForBounds
  // prontos pra isso, falta só o botão e a serialização do canvas.
  return (
    <div
      style={{ height: "70vh" }}
      className="relative overflow-hidden rounded-lg border bg-background/50"
    >
      <ReactFlow
        nodes={nodesWithToggle}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedId(null)}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
        }}
      >
        <Background />
        <Controls showInteractive={false} />
        <Panel
          position="top-left"
          className="flex gap-0.5 rounded-md border bg-card p-0.5 shadow-sm"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.flow.directionTopToBottom}
            title={t.flow.directionTopToBottom}
            onClick={() => setDirection("DOWN")}
            className={cn(direction === "DOWN" && "bg-muted text-foreground")}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.flow.directionLeftToRight}
            title={t.flow.directionLeftToRight}
            onClick={() => setDirection("RIGHT")}
            className={cn(direction === "RIGHT" && "bg-muted text-foreground")}
          >
            <ArrowRight />
          </Button>
        </Panel>
      </ReactFlow>
      {selectedFlowNode && (
        <FlowNodeInspector
          flowNode={selectedFlowNode}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
