import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { forEachControl } from "./walk-canvas-app.js";

/** Tipos de controle sem texto visível próprio, onde um leitor de tela
 * depende inteiramente de `AccessibleLabel` pra descrever o controle —
 * lista conservadora (Microsoft cita estes como os casos mais comuns de
 * gap de acessibilidade em Canvas Apps). */
const NEEDS_ACCESSIBLE_LABEL = new Set(["Icon", "Image", "Button", "Toggle", "Rating", "Slider"]);

/** PL007 — controle interativo sem texto próprio com `AccessibleLabel`
 * ausente ou vazio. "Vazia" é lido de forma ampla (ausente conta como
 * vazia): a propriedade quase nunca é setada explicitamente como `""` — o
 * gap real de acessibilidade é o autor nunca ter setado ela. */
export function pl007EmptyAccessibleLabel(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    forEachControl(artifact, (control, path) => {
      if (!NEEDS_ACCESSIBLE_LABEL.has(control.type)) return;

      const label = control.properties["AccessibleLabel"];
      const isEmpty = !label || (label.kind === "literal" && String(label.literal ?? "").trim() === "");
      if (!isEmpty) return;

      diagnostics.push({
        code: "PL007",
        severity: "warning",
        message: `Controle "${control.name}" (${control.type}) não tem AccessibleLabel — leitor de tela não consegue descrevê-lo.`,
        artifactId: artifact.id,
        path,
        hint: "Setar AccessibleLabel com um texto curto descrevendo a ação/conteúdo do controle.",
      });
    });
  }

  return diagnostics;
}
