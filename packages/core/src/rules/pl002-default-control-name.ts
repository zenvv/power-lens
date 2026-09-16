import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";
import { forEachControl } from "./walk-canvas-app.js";

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Nome default do Studio é sempre "<TipoDoControle><número>" (ex.:
 * "Label1", "Button2") — mesmo esquema pra qualquer tipo, incluindo
 * instâncias de componente (`type` = nome do componente). */
function hasDefaultName(controlType: string, controlName: string): boolean {
  return new RegExp(`^${escapeRegExp(controlType)}[0-9]+$`).test(controlName);
}

/** PL002 — controle com nome default, nunca renomeado pelo autor do app. */
export function pl002DefaultControlName(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl002;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    forEachControl(artifact, (control, path) => {
      // A raiz de uma tela sempre tem type: "Screen" e o próprio nome da tela
      // (spec: "Screen1", "Screen2"...) — diferente de Label/Button, manter o
      // nome numérico de uma tela é comum mesmo em apps bem cuidados, então
      // sinalizar isso aqui só geraria ruído sem sinal.
      if (control.type === "Screen") return;
      if (!hasDefaultName(control.type, control.name)) return;
      diagnostics.push({
        code: "PL002",
        severity: "info",
        message: messages.message({ controlName: control.name }),
        artifactId: artifact.id,
        path,
        hint: messages.hint,
      });
    });
  }

  return diagnostics;
}
