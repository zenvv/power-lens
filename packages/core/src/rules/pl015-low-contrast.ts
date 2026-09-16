import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { resolveScreenLayout, type ResolvedControl } from "../render/wireframe/index.js";

/** Limiar WCAG AA pra texto normal (4.5:1) — texto grande (~18px+) tem um
 * limite menor (3:1) que esta regra não distingue, por não ter garantia de
 * que `fontSize` também resolveu; degradação honesta documentada no hint em
 * vez de fingir precisão que a regra não tem. */
const MIN_CONTRAST_RATIO = 4.5;

function parseRgba(css: string): { r: number; g: number; b: number; a: number } | undefined {
  const match = /^rgba\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)$/.exec(css);
  if (!match) return undefined;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: Number(match[4]) };
}

/** Luminância relativa WCAG — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function walk(node: ResolvedControl, path: string, onLowContrast: (path: string, ratio: number) => void): void {
  if (node.text.status === "resolved" && node.text.value.trim() !== "") {
    if (node.fill.status === "resolved" && node.color.status === "resolved") {
      const bg = parseRgba(node.fill.value);
      const fg = parseRgba(node.color.value);
      // Composição real exigiria conhecer o que está atrás de um fundo
      // semi-transparente — fora do escopo de uma extração rasa, por isso só
      // avalia quando os dois canais alpha são totalmente opacos.
      if (bg && fg && bg.a === 1 && fg.a === 1) {
        const ratio = contrastRatio(bg, fg);
        if (ratio < MIN_CONTRAST_RATIO) onLowContrast(path, ratio);
      }
    }
  }

  for (const child of node.children) walk(child, `${path}/${child.name}`, onLowContrast);
}

/** PL015 — contraste entre `Color` (texto) e `Fill` (fundo) abaixo do
 * mínimo recomendado pela WCAG, calculado só quando os dois resolvem pra
 * uma cor opaca (literal ou `RGBA(...)` com argumentos constantes — mesmo
 * resolvedor do wireframe, spec seção 7). */
export function pl015LowContrast(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    for (const screen of artifact.screens) {
      const resolved = resolveScreenLayout(screen);
      walk(resolved, screen.name, (path, ratio) => {
        diagnostics.push({
          code: "PL015",
          severity: "warning",
          message: `Contraste de ${ratio.toFixed(2)}:1 entre texto e fundo em "${path}", abaixo do mínimo recomendado (4.5:1).`,
          artifactId: artifact.id,
          path,
          hint: "Calculado só quando Fill/Color resolvem pra uma cor totalmente opaca (literal ou RGBA constante) — texto grande tem um limite menor (3:1), não diferenciado aqui.",
        });
      });
    }
  }

  return diagnostics;
}
