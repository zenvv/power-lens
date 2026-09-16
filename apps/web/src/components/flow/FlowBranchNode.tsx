import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { BRANCH_HEADER_HEIGHT } from "@/lib/flow-layout";
import type { FlowRfNodeData } from "@/lib/flow-layout";
import { useI18n } from "@/lib/i18n/context";

/** Rótulo de um branch: o valor cru "true"/"false" pro If (pedido explícito
 * do usuário — "Se sim"/"Se não" confundia, o valor real da definição é o
 * que importa aqui), o nome do case pra um Switch, "Caso padrão" pro
 * `default`. */
function branchLabel(ownerType: string, branch: string, t: ReturnType<typeof useI18n>["t"]): string {
  if (ownerType === "If") return branch;
  if (branch === "default") return t.flow.branch.defaultCase;
  return branch;
}

type FlowBranchNodeProps = NodeProps & { data: FlowRfNodeData };

/**
 * Contêiner puramente visual pro lado "true"/"false" de um If (ou o case de
 * um Switch) — não representa um `FlowNode` do IR, só reagrupa visualmente
 * os filhos que já têm o mesmo `branch` (flow-layout.ts). A caixa em si fica
 * neutra (só o bloco de uma action específica carrega cor de categoria) mas
 * o cabeçalho do lado "true"/"false" de um If ganha um tom verde/vermelho —
 * pedido do usuário, pra identificar o lado sem precisar ler o texto. Um
 * branch sem nenhuma action (If sempre mostra os dois lados, mesmo vazio)
 * vira um placeholder pontilhado com o texto de "Vazio".
 */
function FlowBranchNodeComponent({ data }: FlowBranchNodeProps) {
  const { t } = useI18n();
  if (data.kind !== "branch") return null;

  const isIfTrue = data.ownerType === "If" && data.branch === "true";
  const isIfFalse = data.ownerType === "If" && data.branch === "false";

  return (
    <div className="nopan flex h-full w-full flex-col rounded-md border border-dashed border-border/60">
      <div
        className={cn(
          "flex shrink-0 items-center rounded-t-[5px] px-2 text-[11px] font-medium",
          isIfTrue && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          isIfFalse && "bg-rose-500/15 text-rose-700 dark:text-rose-400",
          !isIfTrue && !isIfFalse && "text-muted-foreground",
        )}
        style={{ height: BRANCH_HEADER_HEIGHT }}
      >
        <span className="truncate">{branchLabel(data.ownerType, data.branch, t)}</span>
      </div>
      {data.isEmpty && (
        <div className="flex flex-1 items-center justify-center text-[11px] text-muted-foreground/60">
          {t.flow.branch.empty}
        </div>
      )}
    </div>
  );
}

export const FlowBranchNode = memo(FlowBranchNodeComponent);
