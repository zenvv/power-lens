import type { Diagnostic, FlowNode, PowerLensDocument } from "../ir/index.js";
import { KNOWN_PREMIUM_CONNECTOR_IDS } from "./pl009-premium-connector.js";

/** Statuses de `runAfter` que contam como "trata falha" — Workflow Definition
 * Language usa "Failed"/"TimedOut" (docs/FORMAT-NOTES.md seção 4: schema
 * público do Azure Logic Apps que o Power Automate reaproveita). Comparação
 * sem diferenciar maiúscula/minúscula, já que nenhum definition.json real
 * deste projeto foi inspecionado ainda pra confirmar a capitalização exata. */
const FAILURE_STATUSES = ["failed", "timedout"];

/** Uma ação é "crítica" quando uma falha silenciosa nela é cara de descobrir
 * depois: chamada HTTP genérica ou conector já listado como premium em PL009
 * (mesma lista, sem duplicar critério). */
function isCriticalAction(node: FlowNode): boolean {
  if (node.type === "Http") return true;
  return node.connectorName !== undefined && KNOWN_PREMIUM_CONNECTOR_IDS.has(node.connectorName);
}

function isHandledBy(node: FlowNode, criticalId: string): boolean {
  return node.runAfter.some(
    (dep) => dep.id === criticalId && dep.statuses.some((status) => FAILURE_STATUSES.includes(status.toLowerCase())),
  );
}

/** PL011 — ação crítica (HTTP ou conector premium) sem nenhum outro passo do
 * mesmo fluxo tratando sua falha (`runAfter` com status Failed/TimedOut). */
export function pl011UnhandledCriticalAction(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "cloudFlow") continue;

    for (const node of artifact.actions) {
      if (!isCriticalAction(node)) continue;
      const handled = artifact.actions.some((other) => isHandledBy(other, node.id));
      if (handled) continue;

      diagnostics.push({
        code: "PL011",
        severity: "warning",
        message: `Ação "${node.name}" (${node.connectorName ?? node.type}) não tem nenhum passo tratando sua falha.`,
        artifactId: artifact.id,
        path: node.name,
        hint: "Adicione um passo com \"Configurar execução após\" (runAfter Failed/TimedOut) pra essa ação, ou confirme que uma falha silenciosa aqui é aceitável.",
      });
    }
  }

  return diagnostics;
}
