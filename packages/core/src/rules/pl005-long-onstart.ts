import type { Diagnostic, PowerLensDocument } from "../ir/index.js";

/** Sem número "certo" documentado em nenhum lugar oficial — 25 linhas é um
 * limiar arbitrário, mas razoável pra sinalizar um OnStart que já deveria
 * ter sido quebrado em componentes/funções nomeadas. */
export const MAX_ONSTART_LINES = 25;

/** PL005 — `App.OnStart` acima de `MAX_ONSTART_LINES` linhas. */
export function pl005LongOnStart(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;
    if (artifact.onStart?.kind !== "formula") continue;

    const lineCount = artifact.onStart.raw.split("\n").length;
    if (lineCount <= MAX_ONSTART_LINES) continue;

    diagnostics.push({
      code: "PL005",
      severity: "info",
      message: `App.OnStart tem ${lineCount} linhas (acima do limiar de ${MAX_ONSTART_LINES}).`,
      artifactId: artifact.id,
      path: "App.OnStart",
      hint: "Considere quebrar em componentes reutilizáveis ou mover parte da lógica pra funções nomeadas.",
    });
  }

  return diagnostics;
}
