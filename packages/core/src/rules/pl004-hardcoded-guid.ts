import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { forEachExpression } from "./walk-canvas-app.js";

const GUID_RE = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

/** PL004 — GUID hardcoded em fórmula (ex.: ID de lista/tabela colado direto
 * em vez de vir de uma referência nomeada) — quebra ao mover o app entre
 * ambientes. */
export function pl004HardcodedGuid(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    forEachExpression(artifact, (expression, propertyName, _control, path) => {
      if (expression.kind !== "formula") return;
      const matches = expression.raw.match(GUID_RE);
      if (!matches) return;

      diagnostics.push({
        code: "PL004",
        severity: "warning",
        message: `${matches.length > 1 ? `${matches.length} GUIDs hardcoded encontrados` : "GUID hardcoded encontrado"} em "${propertyName}".`,
        artifactId: artifact.id,
        path: `${path}.${propertyName}`,
        hint: "GUIDs de lista/tabela/ambiente colados direto na fórmula não sobrevivem a uma migração entre ambientes.",
      });
    });
  }

  return diagnostics;
}
