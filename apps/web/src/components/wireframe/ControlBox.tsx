import type { CSSProperties } from "react";
import type { ResolvedControl } from "@power-lens/core";
import { cn } from "@/lib/utils";
import {
  autoLayoutStyle,
  DYNAMIC_CASCADE_STEP,
  hasDeclaredPosition,
  PLACEHOLDER_HEIGHT,
  PLACEHOLDER_WIDTH,
} from "@/lib/wireframe-canvas";

type ControlBoxProps = {
  control: ResolvedControl;
  /** Filho direto de um container AutoLayout: o espaçamento entre irmãos já
   * vem do `gap` do flex do pai, então não aplica o fallback de margem que
   * o fluxo em bloco normal usa. */
  parentIsAutoLayout?: boolean;
  /** Posição do controle entre os irmãos — usada só como fallback visual
   * (ver `DYNAMIC_CASCADE_STEP`) pra eixos que não resolveram, nunca pra
   * layout de verdade. */
  siblingIndex?: number;
  /** Nome do controle selecionado na árvore lateral (`CanvasTreeView`),
   * pra destacar a caixa correspondente no canvas. */
  selectedControlName?: string | undefined;
};

/**
 * Um retângulo por controle. Quando X/Y foi declarado (resolvido ou
 * dinâmico), posiciona via CSS absoluto — cada caixa com `position:
 * absolute` já vira o contexto de posicionamento dos próprios filhos, sem
 * precisar de wrapper extra. Quando não há X/Y nenhum (container
 * AutoLayout, ver `hasDeclaredPosition`), usa fluxo normal em vez de forçar
 * `(0,0)` e empilhar controles exatamente um em cima do outro.
 */
export function ControlBox({ control, parentIsAutoLayout, siblingIndex = 0, selectedControlName }: ControlBoxProps) {
  if (control.visible.status === "resolved" && !control.visible.value) return null;

  const positioned = hasDeclaredPosition(control);
  // Eixo não resolvido: em vez de colapsar todo mundo em (0,0) — o que
  // empilha caixas dinâmicas exatamente umas sobre as outras e as torna
  // invisíveis —, escalona pela posição entre os irmãos. Só um fallback
  // visual (o dashed border já indica "não confiar nesse número").
  const cascadeFallback = siblingIndex * DYNAMIC_CASCADE_STEP;
  const x = control.x.status === "resolved" ? control.x.value : cascadeFallback;
  const y = control.y.status === "resolved" ? control.y.value : cascadeFallback;
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
  const isSelected = selectedControlName === control.name;

  return (
    <div
      data-control-name={control.name}
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
        isSelected && "ring-2 ring-primary ring-offset-1",
      )}
    >
      {control.text.status === "resolved" && (
        <p className="truncate px-1.5 py-1 text-xs" style={{ color, fontSize, fontWeight }}>
          {control.text.value}
        </p>
      )}
      {control.text.status === "dynamic" && (
        <p className="truncate px-1.5 py-1 text-xs text-muted-foreground italic">(dinâmico)</p>
      )}

      <div style={childStyle}>
        {control.children.map((child, index) => (
          <ControlBox
            key={child.name}
            control={child}
            parentIsAutoLayout={Boolean(control.layout)}
            siblingIndex={index}
            selectedControlName={selectedControlName}
          />
        ))}
      </div>
    </div>
  );
}
