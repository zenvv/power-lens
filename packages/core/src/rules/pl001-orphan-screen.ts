import type { CanvasApp, Diagnostic, PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";
import { forEachExpression } from "./walk-canvas-app.js";

function collectReferencedScreenNames(app: CanvasApp): Set<string> {
  const names = new Set<string>();
  forEachExpression(app, (expression) => {
    for (const ref of expression.references) {
      if (ref.kind === "screen") names.add(ref.name);
    }
  });
  for (const ref of app.onStart?.references ?? []) {
    if (ref.kind === "screen") names.add(ref.name);
  }
  return names;
}

/**
 * PL001 — tela órfã: nenhuma navegação encontrada no app aponta pra ela. A
 * tela de menor `order` é tratada como a tela inicial (aberta implicitamente
 * ao rodar o app, sem precisar de `Navigate`) e nunca é sinalizada.
 */
export function pl001OrphanScreen(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl001;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;
    if (artifact.screens.length === 0) continue;

    const referenced = collectReferencedScreenNames(artifact);
    const homeScreen = artifact.screens.reduce((a, b) => (b.order < a.order ? b : a));

    for (const screen of artifact.screens) {
      if (screen === homeScreen || referenced.has(screen.name)) continue;
      diagnostics.push({
        code: "PL001",
        severity: "warning",
        message: messages.message({ screenName: screen.name }),
        artifactId: artifact.id,
        path: screen.name,
        hint: messages.hint,
      });
    }
  }

  return diagnostics;
}
