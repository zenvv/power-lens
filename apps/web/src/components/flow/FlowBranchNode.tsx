import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { BRANCH_HEADER_HEIGHT } from "@/lib/flow-layout";
import type { FlowRfNodeData } from "@/lib/flow-layout";

/** Rótulo de um ramo de If/Switch — "Se sim"/"Se não" pro true/false de um
 * If (como o Power Automate chama as duas colunas), o nome do case pra um
 * Switch, "Caso padrão" pro `default`. Sem tradução via i18n: o resto da UI
 * do viewer (apps/web) também é só PT-BR, hardcoded — só o texto de
 * diagnóstico do parser (packages/core) passa por i18n. */
function branchLabel(ownerType: string, branch: string): string {
  if (ownerType === "If") {
    if (branch === "true") return "Se sim";
    if (branch === "false") return "Se não";
  }
  if (branch === "default") return "Caso padrão";
  return branch;
}

type FlowBranchNodeProps = NodeProps & { data: FlowRfNodeData };

/**
 * Contêiner puramente visual pro lado "true"/"false" de um If (ou o case de
 * um Switch) — não representa um `FlowNode` do IR, só reagrupa visualmente
 * os filhos que já têm o mesmo `branch` (flow-layout.ts). Por isso não tem
 * cor nem borda de destaque: só o bloco de uma action específica carrega
 * cor (início/fim, categoria da action) — o contêiner de ramo é neutro.
 */
function FlowBranchNodeComponent({ data }: FlowBranchNodeProps) {
  if (data.kind !== "branch") return null;

  return (
    <div className="nopan flex h-full w-full flex-col rounded-md border border-dashed border-border/60">
      <div
        className="flex shrink-0 items-center px-2 text-[11px] font-medium text-muted-foreground"
        style={{ height: BRANCH_HEADER_HEIGHT }}
      >
        <span className="truncate">{branchLabel(data.ownerType, data.branch)}</span>
      </div>
    </div>
  );
}

export const FlowBranchNode = memo(FlowBranchNodeComponent);
