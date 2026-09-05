import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUP_HEADER_HEIGHT } from "@/lib/flow-layout";
import type { FlowRfNodeData } from "@/lib/flow-layout";

/** Deterministic color per connector name, so the same connector always
 * gets the same badge color without a hand-maintained palette (spec
 * section 7: "cor por conector"). */
function connectorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `oklch(0.7 0.12 ${hue})`;
}

export type FlowRfNodeDataWithToggle = FlowRfNodeData & { onToggle?: (id: string) => void };

type FlowNodeProps = NodeProps & { data: FlowRfNodeDataWithToggle };

function FlowNodeComponent({ id, data }: FlowNodeProps) {
  const { flowNode, isGroup, collapsed, childCount, onToggle } = data;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col rounded-lg border text-left",
        isGroup ? "border-border/70 bg-muted/20" : "border-border bg-card px-3 py-2",
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />

      {isGroup ? (
        <button
          type="button"
          onClick={() => onToggle?.(id)}
          className="flex items-center gap-1.5 rounded-t-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          style={{ height: GROUP_HEADER_HEIGHT }}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          <span className="truncate">{flowNode.name}</span>
          <span className="text-[10px] opacity-70">
            ({flowNode.type}
            {collapsed ? `, ${childCount} ação(ões) ocultas` : ""})
          </span>
        </button>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{flowNode.name}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{flowNode.type}</span>
            {flowNode.branch && (
              <span className="rounded-full border px-1.5 py-0 text-[10px]">{flowNode.branch}</span>
            )}
          </div>
          {flowNode.connectorName && (
            <span
              className="mt-1 w-fit rounded-full px-1.5 py-0 text-[10px] text-black/80"
              style={{ backgroundColor: connectorColor(flowNode.connectorName) }}
            >
              {flowNode.connectorName}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export const FlowNode = memo(FlowNodeComponent);
