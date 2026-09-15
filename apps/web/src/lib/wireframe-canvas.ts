import type { ResolvedControl } from "@power-lens/core";

export const PLACEHOLDER_WIDTH = 160;
export const PLACEHOLDER_HEIGHT = 32;
export const MIN_CANVAS_WIDTH = 400;
export const MIN_CANVAS_HEIGHT = 300;
export const CANVAS_PADDING = 24;

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
export function hasDeclaredPosition(control: ResolvedControl): boolean {
  return control.x.status !== "absent" || control.y.status !== "absent";
}

function extent(control: ResolvedControl): { right: number; bottom: number } {
  const x = control.x.status === "resolved" ? control.x.value : 0;
  const y = control.y.status === "resolved" ? control.y.value : 0;
  const width = control.width.status === "resolved" ? control.width.value : PLACEHOLDER_WIDTH;
  const height = control.height.status === "resolved" ? control.height.value : PLACEHOLDER_HEIGHT;
  return { right: x + width, bottom: y + height };
}

/**
 * A tela em si quase nunca tem Width/Height resolvíveis (o canvas do app
 * é definido fora da árvore de controles) — o tamanho do wireframe é
 * inferido da extensão dos filhos diretos posicionados absolutamente, com
 * um piso mínimo. Filhos sem posição declarada (fluxo normal) não entram
 * nessa conta — o navegador já dimensiona o canvas em torno deles.
 */
export function computeCanvasSize(root: ResolvedControl): { width: number; height: number } {
  let maxRight = 0;
  let maxBottom = 0;
  for (const child of root.children) {
    if (!hasDeclaredPosition(child)) continue;
    const { right, bottom } = extent(child);
    maxRight = Math.max(maxRight, right);
    maxBottom = Math.max(maxBottom, bottom);
  }
  return {
    width: Math.max(MIN_CANVAS_WIDTH, maxRight + CANVAS_PADDING),
    height: Math.max(MIN_CANVAS_HEIGHT, maxBottom + CANVAS_PADDING),
  };
}
