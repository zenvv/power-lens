import { memo, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUP_DETAIL_HEIGHT, GROUP_HEADER_HEIGHT } from "@/lib/flow-layout";
import type { FlowRfActionNodeData, FlowRfNodeData } from "@/lib/flow-layout";
import { CONNECTOR_ICONS } from "@/lib/connector-icons";
import {
  FLOW_ACTION_FALLBACK_ICON,
  FLOW_ACTION_TYPE_ICONS,
} from "@/lib/flow-action-icons";
import { FLOW_ACTION_TYPE_COLORS } from "@/lib/flow-action-colors";
import { useI18n } from "@/lib/i18n/context";

/** Ícone de um bloco: o ícone oficial do conector quando ele está no mapa
 * conhecido (CONNECTOR_ICONS), um ícone genérico por tipo de action quando
 * o passo é interno ao motor de fluxo (If, Foreach, Compose...), ou um
 * plugue genérico quando há conector mas ele não está mapeado — nunca some
 * o dado, só degrada o quão específico o ícone é (spec seção 3, "degradação
 * honesta"). Quando não há conector, a cor vem de `FLOW_ACTION_TYPE_COLORS`
 * (categoria da action, como no Power Automate) em vez do cinza padrão. */
function NodeIcon({
  connectorName,
  type,
  className,
  style,
}: {
  connectorName?: string | undefined;
  type: string;
  className?: string;
  style?: CSSProperties | undefined;
}) {
  if (connectorName) {
    const src = CONNECTOR_ICONS[connectorName];
    if (src)
      return (
        <img
          src={src}
          alt={connectorName}
          className={cn("shrink-0 rounded-[99px]", className)}
        />
      );
    return <Plug className={cn("shrink-0 text-muted-foreground", className)} />;
  }
  const color = FLOW_ACTION_TYPE_COLORS[type];
  const Icon = FLOW_ACTION_TYPE_ICONS[type] ?? FLOW_ACTION_FALLBACK_ICON;
  return (
    <Icon
      className={cn("shrink-0", !color && "text-muted-foreground", className)}
      style={color ? { color, ...style } : style}
    />
  );
}

export type FlowRfNodeDataWithToggle = FlowRfNodeData & {
  onToggle?: (id: string) => void;
  isSelected?: boolean;
};

type FlowNodeProps = NodeProps & { data: FlowRfNodeDataWithToggle };

/** Detalhe mostrado no cabeçalho de um grupo If/Foreach no lugar do
 * "(If)"/"(Foreach)" genérico — a condição sendo avaliada ou a coleção
 * sendo iterada, já que "o que esse bloco tá fazendo" era invisível sem
 * abrir o inspector. Só existe pra esses dois tipos (branch.ts/actions.ts
 * só preenchem `condition`/`iterateOver` pra eles). */
function groupDetail(
  flowNode: FlowRfActionNodeData["flowNode"],
): string | undefined {
  if (flowNode.type === "If") return flowNode.condition;
  if (flowNode.type === "Foreach") return flowNode.iterateOver;
  return undefined;
}

function FlowNodeComponent({ id, data }: FlowNodeProps) {
  const { t } = useI18n();
  if (data.kind !== "action") return null;

  const {
    flowNode,
    isGroup,
    collapsed,
    childCount,
    onToggle,
    isSelected,
    direction,
    isTrigger,
    isEnd,
  } = data;
  const isHorizontal = direction === "RIGHT";
  const iconColor = !flowNode.connectorName
    ? FLOW_ACTION_TYPE_COLORS[flowNode.type]
    : undefined;
  const detail = isGroup ? groupDetail(flowNode) : undefined;

  return (
    <div
      className={cn(
        "nopan flex shrink-0 flex-1 min-h-full w-full flex-col rounded-lg border text-left",
        isGroup
          ? "border-border/70 bg-muted/20 h-full"
          : "border-border bg-card p-2 h-full justify-center cursor-pointer hover:border-muted-foreground/50",
        // Início/fim não usam mais cor — misturava com a cor de categoria da
        // action e, num grupo, com o "fim de ramo" de um filho interno. Em
        // vez disso a forma muda: gatilho fica de canto reto (like um
        // ponto de partida "quadrado"), fim vira uma cápsula arredondada.
        // Só no bloco da action específica, nunca no contêiner de um grupo.
        !isGroup && isTrigger && "rounded-sm border-foreground/70",
        !isGroup && isEnd && "rounded-full",
        isSelected && "border-primary ring-3 ring-primary/20",
      )}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className={cn("!bg-muted-foreground", isTrigger && "!invisible")}
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        className={cn("!bg-muted-foreground", isEnd && "!invisible")}
      />

      {isGroup ? (
        <button
          type="button"
          onClick={() => onToggle?.(id)}
          className="nopan flex w-full flex-col text-left"
        >
          <span
            className="flex items-center gap-1.5 rounded-t-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            style={{ height: GROUP_HEADER_HEIGHT }}
          >
            {collapsed ? (
              <ChevronRight className="size-3.5 shrink-0" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0" />
            )}
            <NodeIcon
              connectorName={flowNode.connectorName}
              type={flowNode.type}
              className="size-3.5 shrink-0"
            />
            <span className="shrink-0">{flowNode.name}</span>
            {!detail && (
              <span className="shrink-0 text-[10px] opacity-70">
                ({flowNode.type})
              </span>
            )}
            {collapsed && (
              <span className="shrink-0 text-[10px] opacity-70">
                {t.flow.hiddenActionsSuffix({ count: childCount })}
              </span>
            )}
          </span>
          {/* Bloco da condição (If) / coleção iterada (Foreach), embaixo do
           * cabeçalho em vez de ao lado — pedido do usuário, pra não
           * espremer o nome do grupo numa linha só com um texto que pode
           * ser longo. `line-clamp-2` respeita a altura reservada em
           * flow-layout.ts (GROUP_DETAIL_HEIGHT); title cobre o que
           * estourar as 2 linhas. */}
          {detail && (
            <span
              title={detail}
              className="line-clamp-2 rounded-sm overflow-hidden p-2 mx-2 text-left font-mono text-[10px] border flex items-start align-middle justify-start leading-none text-muted-foreground/80 bg-card/80"
              style={{ maxHeight: GROUP_DETAIL_HEIGHT }}
            >
              {detail}
            </span>
          )}
        </button>
      ) : (
        <>
          <span className={cn("flex gap-1 items-center  overflow-hidden")}>
            <span
              className={cn(
                "size-8 shrink-0 flex items-center justify-center border",
                iconColor ? "border-transparent" : "bg-muted",
                isEnd ? "rounded-full" : "rounded-sm",
              )}
              style={iconColor ? { backgroundColor: iconColor } : undefined}
            >
              <NodeIcon
                connectorName={flowNode.connectorName}
                type={flowNode.type}
                className="size-4"
                style={iconColor ? { color: "white" } : undefined}
              />
            </span>
            <div className="flex flex-col items-start gap-0.5 flex-1 shrink-0">
              <span className="truncate w-full  text-sm font-medium leading-none">
                {flowNode.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground leading-none">
                <span className="">{flowNode.type}</span>
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
