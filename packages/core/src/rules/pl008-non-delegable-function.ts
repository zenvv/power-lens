import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { forEachExpression } from "./walk-canvas-app.js";

/**
 * Deliberadamente curta: `ForAll` é o único caso onde a Microsoft documenta
 * "nunca delegável, ponto" (https://learn.microsoft.com/power-platform/power-fx/reference/function-forall#description
 * — "When used with a data source, this function can't be delegated. Only
 * the first portion of the data source will be retrieved"). A maioria das
 * outras funções (Filter, Sort, Search...) *dependem* do conector e dos
 * operadores usados dentro do predicado pra saber se delegam — decidir isso
 * exigiria um parser de Power Fx de verdade, que este projeto não tem (só
 * extração rasa de referências). Preferir uma lista curta e certa a uma
 * lista longa e errada.
 */
const NEVER_DELEGABLE_FUNCTIONS = new Set(["ForAll"]);

/** PL008 — função sabidamente não-delegável aplicada sobre uma fonte de
 * dados remota (não uma collection local). */
export function pl008NonDelegableFunction(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    forEachExpression(artifact, (expression, propertyName, _control, path) => {
      if (expression.kind !== "formula") return;

      const usedFunctions = expression.references.filter((r) => r.kind === "function" && NEVER_DELEGABLE_FUNCTIONS.has(r.name));
      const usedDataSources = expression.references.filter((r) => r.kind === "dataSource");
      if (usedFunctions.length === 0 || usedDataSources.length === 0) return;

      diagnostics.push({
        code: "PL008",
        severity: "warning",
        message: `${usedFunctions.map((f) => f.name).join(", ")} sobre ${usedDataSources.map((d) => d.name).join(", ")} em "${propertyName}" — nunca delega; só a primeira página da fonte remota é processada.`,
        artifactId: artifact.id,
        path: `${path}.${propertyName}`,
        hint: "Considere substituir por Filter/Sort (delegáveis, dependendo do conector) antes de percorrer o resultado.",
      });
    });
  }

  return diagnostics;
}
