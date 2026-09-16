import type { CSSProperties } from "react";
import type { Resolved, ResolvedAutoLayout } from "@power-lens/core";

export const PLACEHOLDER_WIDTH = 160;
export const PLACEHOLDER_HEIGHT = 32;

/** Deslocamento diagonal por posição entre irmãos, aplicado só a um eixo
 * (X ou Y) que não resolveu — ver `ControlBox`. Sem isso, todo controle
 * posicionado cuja fórmula não resolve cai em `(0,0)` e empilha
 * exatamente sobre os outros na mesma situação, ficando ilegível mesmo com
 * a borda tracejada indicando "dinâmico". */
export const DYNAMIC_CASCADE_STEP = 28;

/**
 * Um container `AutoLayout` (cada vez mais o padrão no Studio moderno) não
 * escreve X/Y nos filhos — a posição é calculada por um layout flex em
 * tempo de execução, não é "dinâmica" no sentido de uma fórmula não
 * resolvida, simplesmente não existe no arquivo. Forçar esses controles pra
 * `(0,0)` absoluto faz eles se empilharem exatamente uns sobre os outros
 * (visto ao verificar no browser) — em vez disso, um controle sem X *e* Y
 * declarados usa fluxo normal (empilhado verticalmente pelo próprio
 * navegador), só os que têm alguma posição (resolvida ou dinâmica) usam
 * posicionamento absoluto.
 */
export function hasDeclaredPosition(control: { x: Resolved<number>; y: Resolved<number> }): boolean {
  return control.x.status !== "absent" || control.y.status !== "absent";
}

function resolvedValue<T>(r: Resolved<T>): T | undefined {
  return r.status === "resolved" ? r.value : undefined;
}

const ALIGN_ITEMS: Record<string, string> = {
  Start: "flex-start",
  Center: "center",
  End: "flex-end",
  Stretch: "stretch",
};

const JUSTIFY_CONTENT: Record<string, string> = {
  Start: "flex-start",
  Center: "center",
  End: "flex-end",
  SpaceBetween: "space-between",
  SpaceAround: "space-around",
  SpaceEvenly: "space-evenly",
};

/**
 * Nomes de propriedade do AutoLayout (`LayoutDirection`, `LayoutAlignItems`
 * etc.) inferidos da documentação pública do Power Apps, não confirmados
 * contra um `.msapp` real — docs/FORMAT-NOTES.md só confirma `BorderStyle`
 * e `Width: =Parent.Width` nesse container. Um membro de enum fora do mapa
 * (nome errado ou valor não previsto) cai no default do CSS em vez de
 * quebrar o layout.
 */
export function autoLayoutStyle(layout: ResolvedAutoLayout): CSSProperties {
  const direction = resolvedValue(layout.direction);
  const align = resolvedValue(layout.align);
  const justify = resolvedValue(layout.justify);

  return {
    display: "flex",
    flexDirection: direction === "Horizontal" ? "row" : "column",
    flexWrap: direction === "Horizontal" ? "wrap" : undefined,
    gap: resolvedValue(layout.gap),
    alignItems: align ? ALIGN_ITEMS[align] : undefined,
    justifyContent: justify ? JUSTIFY_CONTENT[justify] : undefined,
    paddingTop: resolvedValue(layout.paddingTop),
    paddingRight: resolvedValue(layout.paddingRight),
    paddingBottom: resolvedValue(layout.paddingBottom),
    paddingLeft: resolvedValue(layout.paddingLeft),
  };
}
