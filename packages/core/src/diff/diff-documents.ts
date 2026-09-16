import type { Artifact, CanvasApp, CloudFlow, DataModel, PowerLensDocument, Report, SolutionMeta } from "../ir/index.js";
import { diffCanvasApp } from "./diff-canvas-app.js";
import { diffCloudFlow } from "./diff-cloud-flow.js";
import { diffDataModel } from "./diff-data-model.js";
import { diffReport } from "./diff-report.js";
import { diffSolutionMeta } from "./diff-solution-meta.js";
import type { DiffEntry } from "./diff-utils.js";

export type { DiffEntry } from "./diff-utils.js";

export type ArtifactDiffStatus = "added" | "removed" | "changed";

export type ArtifactDiff = {
  /** `"<kind>:<name>"` — a mesma chave usada pra casar o artefato entre os
   * dois documentos (ver `diffDocuments`). */
  key: string;
  kind: Artifact["kind"];
  status: ArtifactDiffStatus;
  /** Vazio quando `status` é `"added"`/`"removed"` — o artefato inteiro é a
   * mudança, não há por que listar campo a campo. */
  entries: DiffEntry[];
};

export type DocumentDiff = { artifacts: ArtifactDiff[] };

/** Roteia pro differ específico do tipo — `before`/`after` compartilham
 * `kind` na prática porque `diffDocuments` só chama isso depois de casar os
 * dois pela chave `${kind}:${name}` (ver abaixo); o cast reflete essa
 * garantia externa, não uma suposição nova. */
function diffArtifactBody(before: Artifact, after: Artifact): DiffEntry[] {
  switch (after.kind) {
    case "canvasApp":
      return diffCanvasApp(before as CanvasApp, after);
    case "cloudFlow":
      return diffCloudFlow(before as CloudFlow, after);
    case "dataModel":
      return diffDataModel(before as DataModel, after);
    case "report":
      return diffReport(before as Report, after);
    case "solutionMeta":
      return diffSolutionMeta(before as SolutionMeta, after);
  }
}

function artifactKey(artifact: Artifact): string {
  return `${artifact.kind}:${artifact.name}`;
}

/**
 * Diff estrutural entre dois `PowerLensDocument` — pensado pra comparar
 * duas exportações independentes do "mesmo" artefato (antes/depois de uma
 * mudança, ou a versão de outra pessoa). Casa artefato por
 * `"<kind>:<name>"` (não por `id`, que o parser gera de novo a cada
 * exportação e não é estável) — um `CanvasApp` chamado "MeuApp" na v1 e na
 * v2 é tratado como o mesmo artefato mesmo com `id` diferente.
 *
 * Artefato presente só em `b` vira `"added"`, só em `a` vira `"removed"`,
 * presente nos dois mas idêntico não aparece no resultado (nada mudou, nada
 * pra mostrar) — só entra como `"changed"` quando há pelo menos um
 * `DiffEntry`.
 */
export function diffDocuments(a: PowerLensDocument, b: PowerLensDocument): DocumentDiff {
  const beforeByKey = new Map(a.artifacts.map((artifact) => [artifactKey(artifact), artifact] as const));
  const afterByKey = new Map(b.artifacts.map((artifact) => [artifactKey(artifact), artifact] as const));

  const artifacts: ArtifactDiff[] = [];

  for (const [key, after] of afterByKey) {
    const before = beforeByKey.get(key);
    if (!before) {
      artifacts.push({ key, kind: after.kind, status: "added", entries: [] });
      continue;
    }
    const entries = diffArtifactBody(before, after);
    if (entries.length > 0) artifacts.push({ key, kind: after.kind, status: "changed", entries });
  }

  for (const [key, before] of beforeByKey) {
    if (!afterByKey.has(key)) artifacts.push({ key, kind: before.kind, status: "removed", entries: [] });
  }

  return { artifacts };
}
