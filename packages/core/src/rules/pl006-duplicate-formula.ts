import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";
import { forEachControl } from "./walk-canvas-app.js";

/** Ajustável via `options.minOccurrences` (Fase 8 do plano de features:
 * regras configuráveis). */
export const MIN_OCCURRENCES = 3;

/** PL006 — a mesma fórmula (texto idêntico) aparece em N+ controles
 * diferentes (default `MIN_OCCURRENCES`, ajustável via
 * `options.minOccurrences`) — candidata a virar uma função nomeada ou
 * variável. */
export function pl006DuplicateFormula(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const minOccurrences = options?.minOccurrences ?? MIN_OCCURRENCES;
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl006;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    const controlsByFormula = new Map<string, Set<string>>();
    forEachControl(artifact, (control, path) => {
      for (const expression of Object.values(control.properties)) {
        if (expression.kind !== "formula") continue;
        const controls = controlsByFormula.get(expression.raw) ?? new Set<string>();
        controls.add(path);
        controlsByFormula.set(expression.raw, controls);
      }
    });

    for (const [formula, controls] of controlsByFormula) {
      if (controls.size < minOccurrences) continue;
      const preview = formula.length > 80 ? `${formula.slice(0, 80)}…` : formula;
      diagnostics.push({
        code: "PL006",
        severity: "info",
        message: messages.message({ preview, count: controls.size }),
        artifactId: artifact.id,
        hint: messages.hint({ controls: [...controls] }),
      });
    }
  }

  return diagnostics;
}
