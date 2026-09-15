import type { CSSProperties } from "react";
import type { ResolvedControl } from "@power-lens/core";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { autoLayoutStyle, hasDeclaredPosition, PLACEHOLDER_HEIGHT, PLACEHOLDER_WIDTH } from "@/lib/wireframe-canvas";

type ControlBoxProps = {
  control: ResolvedControl;
  /** Filho direto de um container AutoLayout: o espaçamento entre irmãos já
   * vem do `gap` do flex do pai, então não aplica o fallback de margem que
   * o fluxo em bloco normal usa. */
  parentIsAutoLayout?: boolean;
};

/**
 * Um retângulo por controle. Quando X/Y foi declarado (resolvido ou
 * dinâmico), posiciona via CSS absoluto — cada caixa com `position:
 * absolute` já vira o contexto de posicionamento dos próprios filhos, sem
 * precisar de wrapper extra. Quando não há X/Y nenhum (container
 * AutoLayout, ver `hasDeclaredPosition`), usa fluxo normal em vez de forçar
 * `(0,0)` e empilhar controles exatamente um em cima do outro.
 */
export function ControlBox({ control, parentIsAutoLayout }: ControlBoxProps) {
  if (control.visible.status === "resolved" && !control.visible.value) return null;

  const positioned = hasDeclaredPosition(control);
  const x = control.x.status === "resolved" ? control.x.value : 0;
  const y = control.y.status === "resolved" ? control.y.value : 0;
  const resolvedWidth = control.width.status === "resolved" ? control.width.value : undefined;
  const resolvedHeight = control.height.status === "resolved" ? control.height.value : undefined;
  // Só força o placeholder de tamanho quando o controle está posicionado
  // absoluto e o tamanho não resolveu — sem isso a caixa colapsaria pra
  // 0×0 e ficaria invisível. Um controle em fluxo normal (não posicionado)
  // sem Width/Height resolvido só deixa o navegador dimensionar pelo
  // conteúdo, que é o comportamento certo pra filho de AutoLayout.
  const width = positioned ? (resolvedWidth ?? PLACEHOLDER_WIDTH) : resolvedWidth;
  const height = positioned ? (resolvedHeight ?? PLACEHOLDER_HEIGHT) : resolvedHeight;
  const background = control.fill.status === "resolved" ? control.fill.value : undefined;
  const color = control.color.status === "resolved" ? control.color.value : undefined;
  const fontSize = control.fontSize.status === "resolved" ? control.fontSize.value : undefined;
  const fontWeight = control.bold.status === "resolved" && control.bold.value ? 600 : undefined;

  const borderStyleValue = control.borderStyle.status === "resolved" ? control.borderStyle.value : undefined;
  const borderColorValue = control.borderColor.status === "resolved" ? control.borderColor.value : undefined;
  const borderWidthValue = control.borderThickness.status === "resolved" ? control.borderThickness.value : undefined;
  const borderIsNone = borderStyleValue === "None";
  const explicitBorder =
    !borderIsNone && borderColorValue && borderWidthValue !== undefined
      ? `${borderWidthValue}px ${(borderStyleValue ?? "Solid").toLowerCase()} ${borderColorValue}`
      : undefined;

  const isDynamic = [control.x, control.y, control.width, control.height].some((r) => r.status === "dynamic");

  const childStyle: CSSProperties = control.layout ? autoLayoutStyle(control.layout) : { display: "flex", flexDirection: "column" };

  return (
    <div
      title={`${control.name} (${control.type})${isDynamic ? " — posição/tamanho não resolvido, fórmula dinâmica" : ""}`}
      style={{
        ...(positioned ? { left: x, top: y } : {}),
        width,
        height,
        background,
        color,
        fontSize,
        fontWeight,
        ...(borderIsNone ? { border: "none" } : explicitBorder ? { border: explicitBorder } : {}),
      }}
      className={cn(
        "overflow-hidden rounded-sm text-left",
        positioned ? "absolute" : parentIsAutoLayout ? "relative" : "relative mb-1 w-full last:mb-0",
        explicitBorder === undefined && !borderIsNone && (isDynamic ? "border border-dashed border-muted-foreground/50" : "border border-border"),
        !background && "bg-card/60",
      )}
    >
      <div className="flex items-center gap-1 border-b border-black/5 bg-black/5 px-1 py-0.5 text-[9px] text-muted-foreground">
        {isDynamic && <Ellipsis className="size-2.5 shrink-0" />}
        <span className="truncate">{control.type}</span>
      </div>

      {control.text.status === "resolved" && (
        <p className="truncate px-1.5 py-1 text-xs" style={{ color, fontSize, fontWeight }}>
          {control.text.value}
        </p>
      )}
      {control.text.status === "dynamic" && (
        <p className="truncate px-1.5 py-1 text-xs text-muted-foreground italic">(dinâmico)</p>
      )}

      <div style={childStyle}>
        {control.children.map((child) => (
          <ControlBox key={child.name} control={child} parentIsAutoLayout={Boolean(control.layout)} />
        ))}
      </div>
    </div>
  );
}
