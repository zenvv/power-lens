import type { CanvasApp, CloudFlow, DataModel, DependencyEdge, Diagnostic, FlowNode, PowerLensDocument } from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";

/** `dataSource.name`/`table.name` não seguem a mesma convenção de
 * capitalização (nome de exibição do app vs. nome lógico Dataverse) — nunca
 * validado contra uma solution real com app conectado a uma tabela
 * Dataverse (docs/FORMAT-NOTES.md). Match exato (case-insensitive) vira
 * `"exact"`; um nome contido no outro vira `"heuristic"`, pra não perder o
 * vínculo só por causa de plural/prefixo. */
function matchConfidence(a: string, b: string): "exact" | "heuristic" | undefined {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left === right) return "exact";
  if (left.includes(right) || right.includes(left)) return "heuristic";
  return undefined;
}

function linkCanvasAppsToDataverseTables(canvasApps: readonly CanvasApp[], dataModels: readonly DataModel[]): DependencyEdge[] {
  const edges: DependencyEdge[] = [];

  for (const app of canvasApps) {
    for (const dataSource of app.dataSources) {
      for (const model of dataModels) {
        for (const table of model.tables) {
          const confidence = matchConfidence(dataSource.name, table.name);
          if (!confidence) continue;

          edges.push({
            fromArtifactId: app.id,
            from: { kind: "dataSource", name: dataSource.name },
            toArtifactId: model.id,
            toKind: "table",
            toName: table.name,
            confidence,
          });
        }
      }
    }
  }

  return edges;
}

/**
 * [LACUNA] Extrai o identificador de fluxo filho de uma ação "Executar um
 * Fluxo Filho" (`type: "Workflow"`, `inputs.host.workflow.id`) — schema
 * público do Workflow Definition Language, nunca confirmado contra um
 * definition.json real deste projeto (docs/FORMAT-NOTES.md seção 4). `id`
 * costuma ser um path terminando no GUID interno do fluxo referenciado;
 * pega só o último segmento não vazio.
 */
function extractChildFlowRef(node: FlowNode): string | undefined {
  if (node.type !== "Workflow") return undefined;
  const inputs = node.inputs;
  if (typeof inputs !== "object" || inputs === null || !("host" in inputs)) return undefined;

  const host = (inputs as { host?: unknown }).host;
  if (typeof host !== "object" || host === null || !("workflow" in host)) return undefined;

  const workflow = (host as { workflow?: unknown }).workflow;
  if (typeof workflow !== "object" || workflow === null || !("id" in workflow)) return undefined;

  const id = (workflow as { id?: unknown }).id;
  if (typeof id !== "string" || id.trim() === "") return undefined;

  return id.split("/").filter(Boolean).pop();
}

function linkChildFlows(flows: readonly CloudFlow[], diagnostics: Diagnostic[], locale: Locale = DEFAULT_LOCALE): DependencyEdge[] {
  const messages = getMessages(locale).parsers.solution;
  const edges: DependencyEdge[] = [];

  for (const flow of flows) {
    for (const node of [flow.trigger, ...flow.actions]) {
      const ref = extractChildFlowRef(node);
      if (!ref) continue;

      const target = flows.find((candidate) => candidate.id !== flow.id && matchConfidence(candidate.id, ref));
      if (!target) {
        diagnostics.push({
          code: "PL310",
          severity: "info",
          message: messages.childFlowNotFound.message({ actionName: node.name, ref }),
          artifactId: flow.id,
          path: node.name,
          hint: messages.childFlowNotFound.hint,
        });
        continue;
      }

      edges.push({
        fromArtifactId: flow.id,
        from: { kind: "flowAction", name: node.name },
        toArtifactId: target.id,
        toKind: "flow",
        toName: target.name,
        confidence: matchConfidence(target.id, ref) ?? "heuristic",
      });
    }
  }

  return edges;
}

/**
 * Cruza os artefatos já montados de uma solution pra achar vínculos entre
 * eles — roda no fim do parse, depois que `document.artifacts` já tem tudo
 * (mesmo motivo de `runHealthChecks` rodar pós-parse: precisa ver o
 * documento inteiro de uma vez). Nunca lança; referência não resolvida vira
 * `Diagnostic`, não erro.
 */
export function linkDependencies(
  document: PowerLensDocument,
  diagnostics: Diagnostic[],
  locale: Locale = DEFAULT_LOCALE,
): DependencyEdge[] {
  const canvasApps = document.artifacts.filter((a): a is CanvasApp => a.kind === "canvasApp");
  const dataModels = document.artifacts.filter((a): a is DataModel => a.kind === "dataModel");
  const flows = document.artifacts.filter((a): a is CloudFlow => a.kind === "cloudFlow");

  return [...linkCanvasAppsToDataverseTables(canvasApps, dataModels), ...linkChildFlows(flows, diagnostics, locale)];
}
