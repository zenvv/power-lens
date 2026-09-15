import type { CanvasApp, Diagnostic, PowerLensDocument } from "../ir/index.js";
import { forEachExpression } from "./walk-canvas-app.js";

function collectReferencedDataSourceNames(app: CanvasApp): Set<string> {
  const names = new Set<string>();
  forEachExpression(app, (expression) => {
    for (const ref of expression.references) {
      if (ref.kind === "dataSource") names.add(ref.name);
    }
  });
  for (const ref of app.onStart?.references ?? []) {
    if (ref.kind === "dataSource") names.add(ref.name);
  }
  return names;
}

/** PL003 — datasource declarado em References/DataSources.json mas nunca
 * usado em nenhuma fórmula encontrada. */
export function pl003UnusedDataSource(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    const referenced = collectReferencedDataSourceNames(artifact);
    for (const dataSource of artifact.dataSources) {
      if (referenced.has(dataSource.name)) continue;
      diagnostics.push({
        code: "PL003",
        severity: "warning",
        message: `Fonte de dados "${dataSource.name}" está declarada mas não foi encontrada em nenhuma fórmula do app.`,
        artifactId: artifact.id,
        hint: "A extração de referências é rasa — confirme antes de remover a conexão, ela pode ser usada só dentro de um componente ou por uma expressão que a análise não capturou.",
      });
    }
  }

  return diagnostics;
}
