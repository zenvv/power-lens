import type { ResolvedControl } from "@power-lens/core";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasDeclaredPosition, PLACEHOLDER_HEIGHT, PLACEHOLDER_WIDTH } from "@/lib/wireframe-canvas";

type ControlBoxProps = {
  control: ResolvedControl;
};

/**
 * Um retângulo por controle. Quando X/Y foi declarado (resolvido ou
 * dinâmico), posiciona via CSS absoluto — cada caixa com `position:
 * absolute` já vira o contexto de posicionamento dos próprios filhos, sem
 * precisar de wrapper extra. Quando não há X/Y nenhum (container
 * AutoLayout, ver `hasDeclaredPosition`), usa fluxo normal em vez de forçar
 * `(0,0)` e empilhar controles exatamente um em cima do outro.
 */
export function ControlBox({ control }: ControlBoxProps) {
  const positioned = hasDeclaredPosition(control);
  const x = control.x.status === "resolved" ? control.x.value : 0;
  const y = control.y.status === "resolved" ? control.y.value : 0;
  const width = control.width.status === "resolved" ? control.width.value : PLACEHOLDER_WIDTH;
  const height = control.height.status === "resolved" ? control.height.value : PLACEHOLDER_HEIGHT;
  const background = control.fill.status === "resolved" ? control.fill.value : undefined;

  const isDynamic = [control.x, control.y, control.width, control.height].some((r) => r.status === "dynamic");

  return (
    <div
      title={`${control.name} (${control.type})${isDynamic ? " — posição/tamanho não resolvido, fórmula dinâmica" : ""}`}
      style={positioned ? { left: x, top: y, width, height, background } : { background }}
      className={cn(
        "flex flex-col overflow-hidden rounded-sm border text-left",
        positioned ? "absolute" : "relative mb-1 w-full last:mb-0",
        isDynamic ? "border-dashed border-muted-foreground/50" : "border-border",
        !background && "bg-card/60",
      )}
    >
      <div className="flex items-center gap-1 border-b border-black/5 bg-black/5 px-1 py-0.5 text-[9px] text-muted-foreground">
        {isDynamic && <Ellipsis className="size-2.5 shrink-0" />}
        <span className="truncate">{control.type}</span>
      </div>

      {control.text.status === "resolved" && (
        <p className="truncate px-1.5 py-1 text-xs">{control.text.value}</p>
      )}
      {control.text.status === "dynamic" && (
        <p className="truncate px-1.5 py-1 text-xs text-muted-foreground italic">(dinâmico)</p>
      )}

      {control.children.map((child) => (
        <ControlBox key={child.name} control={child} />
      ))}
    </div>
  );
}
