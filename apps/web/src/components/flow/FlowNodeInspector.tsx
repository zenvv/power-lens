import type { FlowNode } from "@power-lens/core";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CONNECTOR_ICONS } from "@/lib/connector-icons";

type FlowNodeInspectorProps = {
  flowNode: FlowNode;
  onClose: () => void;
};

/**
 * Painel lateral com o que o bloco selecionado recebe: nome, tipo, conector,
 * runAfter e `inputs` bruto do definition.json. Não existe seção de
 * "outputs" de propósito — a definição estática de um fluxo não carrega
 * exemplo de saída (isso só existiria no histórico de execuções, que não é
 * um artefato lido pela ferramenta) — degradação honesta em vez de mostrar
 * um "Outputs" vazio como se faltasse extrair algo.
 */
export function FlowNodeInspector({ flowNode, onClose }: FlowNodeInspectorProps) {
  const iconSrc = flowNode.connectorName ? CONNECTOR_ICONS[flowNode.connectorName] : undefined;

  return (
    <div className="absolute top-0 right-0 flex h-full w-80 flex-col border-l bg-card shadow-lg">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {iconSrc && <img src={iconSrc} alt={flowNode.connectorName} className="size-5 shrink-0 rounded-[3px]" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{flowNode.name}</p>
          <p className="truncate text-xs text-muted-foreground">{flowNode.type}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar">
          <X />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3 text-xs">
          {flowNode.summary && (
            <section>
              <h4 className="mb-1 font-medium text-muted-foreground">Descrição</h4>
              <p>{flowNode.summary}</p>
            </section>
          )}

          {flowNode.connectorName && (
            <section>
              <h4 className="mb-1 font-medium text-muted-foreground">Conector</h4>
              <p>{flowNode.connectorName}</p>
            </section>
          )}

          {flowNode.runAfter.length > 0 && (
            <section>
              <h4 className="mb-1 font-medium text-muted-foreground">Executa depois de</h4>
              <ul className="flex flex-col gap-0.5">
                {flowNode.runAfter.map((r) => (
                  <li key={r.id}>
                    {r.id} <span className="text-muted-foreground">({r.statuses.join(", ")})</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h4 className="mb-1 font-medium text-muted-foreground">Inputs</h4>
            {flowNode.inputs !== undefined ? (
              <pre className="rounded-md bg-muted p-2 break-all whitespace-pre-wrap">
                {typeof flowNode.inputs === "string" ? flowNode.inputs : JSON.stringify(flowNode.inputs, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">Este passo não declara inputs na definição.</p>
            )}
          </section>

          <section>
            <h4 className="mb-1 font-medium text-muted-foreground">Outputs</h4>
            <p className="text-muted-foreground">
              Não disponível: a definição estática do fluxo não carrega exemplos de saída — isso só existe no
              histórico de execuções, que não é lido por esta ferramenta.
            </p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
