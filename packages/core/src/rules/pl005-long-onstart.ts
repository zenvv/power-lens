import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
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
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;
    if (artifact.onStart?.kind !== "formula") continue;

    const lineCount = artifact.onStart.raw.split("\n").length;
    if (lineCount <= maxLines) continue;

    diagnostics.push({
      code: "PL005",
      severity: "info",
      message: `App.OnStart tem ${lineCount} linhas (acima do limiar de ${maxLines}).`,
      artifactId: artifact.id,
      path: "App.OnStart",
      hint: "Considere quebrar em componentes reutilizáveis ou mover parte da lógica pra funções nomeadas.",
    });
  }

  return diagnostics;
}
