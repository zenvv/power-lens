import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUP_HEADER_HEIGHT } from "@/lib/flow-layout";
import type { FlowRfNodeData } from "@/lib/flow-layout";
import { CONNECTOR_ICONS } from "@/lib/connector-icons";
import {
  FLOW_ACTION_FALLBACK_ICON,
  FLOW_ACTION_TYPE_ICONS,
} from "@/lib/flow-action-icons";

/** Ícone de um bloco: o ícone oficial do conector quando ele está no mapa
 * conhecido (CONNECTOR_ICONS), um ícone genérico por tipo de action quando
 * o passo é interno ao motor de fluxo (If, Foreach, Compose...), ou um
 * plugue genérico quando há conector mas ele não está mapeado — nunca some
 * o dado, só degrada o quão específico o ícone é (spec seção 3, "degradação
 * honesta"). */
function NodeIcon({
  connectorName,
  type,
  className,
}: {
  connectorName?: string | undefined;
  type: string;
  className?: string;
}) {
  if (connectorName) {
    const src = CONNECTOR_ICONS[connectorName];
    if (src)
      return (
        <img
          src={src}
          alt={connectorName}
          className={cn("shrink-0 rounded-[3px]", className)}
        />
      );
    return <Plug className={cn("shrink-0 text-muted-foreground", className)} />;
  }
  const Icon = FLOW_ACTION_TYPE_ICONS[type] ?? FLOW_ACTION_FALLBACK_ICON;
  return <Icon className={cn("shrink-0 text-muted-foreground", className)} />;
}

export type FlowRfNodeDataWithToggle = FlowRfNodeData & {
  onToggle?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
};

type FlowNodeProps = NodeProps & { data: FlowRfNodeDataWithToggle };

function FlowNodeComponent({ id, data }: FlowNodeProps) {
  const { flowNode, isGroup, collapsed, childCount, onToggle, onSelect, isSelected } = data;

  return (
    <div
      onClick={isGroup ? undefined : () => onSelect?.(id)}
      className={cn(
        "flex  w-full flex-col rounded-lg border text-left",
        isGroup
          ? "border-border/70 bg-muted/20 h-full"
          : "border-border bg-card p-2 h-max cursor-pointer hover:border-muted-foreground/50",
        isSelected && "border-primary ring-1 ring-primary",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground"
      />

      {isGroup ? (
        <button
          type="button"
          onClick={() => onToggle?.(id)}
          className="flex items-center gap-1.5 rounded-t-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          style={{ height: GROUP_HEADER_HEIGHT }}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
          <NodeIcon
            connectorName={flowNode.connectorName}
            type={flowNode.type}
            className="size-3.5"
          />
          <span className="truncate">{flowNode.name}</span>
          <span className="text-[10px] opacity-70">
            ({flowNode.type}
            {collapsed ? `, ${childCount} ação(ões) ocultas` : ""})
          </span>
        </button>
      ) : (
        <>
          <span className="flex items-center gap-2 shrink-0 overflow-hidden">
            <span className="size-8 shrink-0 bg-muted flex items-center justify-center border rounded-sm">
              <NodeIcon
                connectorName={flowNode.connectorName}
                type={flowNode.type}
                className="size-4"
              />
            </span>
            <div className="flex flex-col items-start gap-0.5">
              <span className="truncate text-sm font-medium leading-none">
                {flowNode.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground leading-none">
                <span className="truncate">{flowNode.type}</span>
                {flowNode.branch && (
                  <span className="rounded-full border px-1.5 py-0 text-[10px]">
                    {flowNode.branch}
                  </span>
                )}
              </div>
            </div>
          </span>
        </>
      )}
    </div>
  );
}

export const FlowNode = memo(FlowNodeComponent);
