import type { CanvasApp, Diagnostic, PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";
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
export function pl003UnusedDataSource(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl003;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    const referenced = collectReferencedDataSourceNames(artifact);
    for (const dataSource of artifact.dataSources) {
      if (referenced.has(dataSource.name)) continue;
      diagnostics.push({
        code: "PL003",
        severity: "warning",
        message: messages.message({ dataSourceName: dataSource.name }),
        artifactId: artifact.id,
        hint: messages.hint,
      });
    }
  }

  return diagnostics;
}
