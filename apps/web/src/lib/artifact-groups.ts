import type { PowerLensDocument } from "@power-lens/core";

/** Agrupa os artefatos de um documento por tipo. Usado tanto pela navegação
 * lateral (pra saber quais seções mostrar e com que contagem) quanto pelo
 * conteúdo (`DocumentView`) — um único lugar pra não deixar as duas listas
 * divergirem. */
export function groupArtifactsByKind(document: PowerLensDocument) {
  return {
    flows: document.artifacts.filter((a) => a.kind === "cloudFlow"),
    models: document.artifacts.filter((a) => a.kind === "dataModel"),
    canvasApps: document.artifacts.filter((a) => a.kind === "canvasApp"),
    reports: document.artifacts.filter((a) => a.kind === "report"),
  };
}
