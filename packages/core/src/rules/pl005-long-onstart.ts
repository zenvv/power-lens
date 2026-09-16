import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";

/** Sem número "certo" documentado em nenhum lugar oficial — 25 linhas é um
 * limiar arbitrário, mas razoável pra sinalizar um OnStart que já deveria
 * ter sido quebrado em componentes/funções nomeadas. Ajustável via
 * `options.maxLines` (Fase 8 do plano de features: regras configuráveis). */
export const MAX_ONSTART_LINES = 25;

/** PL005 — `App.OnStart` acima do limiar de linhas (default
 * `MAX_ONSTART_LINES`, ajustável via `options.maxLines`). */
export function pl005LongOnStart(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const maxLines = options?.maxLines ?? MAX_ONSTART_LINES;
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl005;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;
    if (artifact.onStart?.kind !== "formula") continue;

    const lineCount = artifact.onStart.raw.split("\n").length;
    if (lineCount <= maxLines) continue;

    diagnostics.push({
      code: "PL005",
      severity: "info",
      message: messages.message({ lineCount, maxLines }),
      artifactId: artifact.id,
      path: "App.OnStart",
      hint: messages.hint,
    });
  }

  return diagnostics;
}
