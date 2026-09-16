import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AppWindow, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreenNavNodeData } from "@/lib/screen-nav-layout";

type ScreenNavNodeProps = NodeProps & { data: ScreenNavNodeData };

/** Nó de tela do mapa de navegação (Fase 11) — o nó sintético "App"
 * (navegação disparada em `App.OnStart`) ganha um ícone diferente pra não
 * ser confundido com uma tela de verdade. */
function ScreenNavNodeComponent({ data }: ScreenNavNodeProps) {
  const Icon = data.isSynthetic ? Play : AppWindow;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-sm",
        data.isSynthetic && "border-dashed text-muted-foreground",
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export const ScreenNavNode = memo(ScreenNavNodeComponent);
