import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AppWindow, Database, FileText, Workflow, type LucideIcon } from "lucide-react";
import type { Artifact } from "@power-lens/core";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/context";
import type { DependencyRfNodeData } from "@/lib/dependency-graph-layout";

const KIND_ICON: Record<Artifact["kind"], LucideIcon> = {
  canvasApp: AppWindow,
  cloudFlow: Workflow,
  dataModel: Database,
  report: FileText,
  solutionMeta: FileText,
};

type DependencyNodeProps = NodeProps & { data: DependencyRfNodeData };

/** Nó do grafo de dependência (Fase 13) — hover mostra tipo + nome
 * completo do artefato (o rótulo no nó já pode vir truncado). */
function DependencyNodeComponent({ data }: DependencyNodeProps) {
  const { t } = useI18n();
  const Icon = KIND_ICON[data.kind];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-full w-full items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-sm">
          <Handle type="target" position={Position.Left} className="opacity-0" />
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{data.label}</span>
          <Handle type="source" position={Position.Right} className="opacity-0" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {t.dependencies.artifactKindLabel[data.kind]} · {data.fullName}
      </TooltipContent>
    </Tooltip>
  );
}

export const DependencyNode = memo(DependencyNodeComponent);
