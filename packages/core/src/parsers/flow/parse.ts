import { createEmptyDocument, type CloudFlow, type Diagnostic, type FlowNode, type PowerLensDocument } from "../../ir/index.js";
import { buildConnectionRefs, extractConnectorName, flattenActions } from "./actions.js";
import type { RawFlowPackage, RawWorkflowDefinition } from "./raw-shapes.js";

export type FlowSource = {
  fileName: string;
  fileSize: number;
};

function resolveDefinition(parsed: RawWorkflowDefinition & RawFlowPackage): RawWorkflowDefinition | undefined {
  if (parsed.triggers || parsed.actions) return parsed;
  if (parsed.properties?.definition) return parsed.properties.definition;
  return undefined;
}

/**
 * Parses a Cloud Flow definition.json into a PowerLensDocument. The schema
 * is the publicly documented Logic Apps Workflow Definition Language, not
 * verified against a real file from this project (docs/FORMAT-NOTES.md
 * section 4) — degrades to a Diagnostic rather than throwing whenever the
 * shape doesn't hold.
 */
export function parseFlow(bytes: Uint8Array, source: FlowSource): PowerLensDocument {
  const document = createEmptyDocument({ ...source, detectedFormat: "flow" });
  const diagnostics: Diagnostic[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8").decode(bytes));
  } catch (err) {
    diagnostics.push({
      code: "PL400",
      severity: "error",
      message: `Não foi possível interpretar o arquivo como JSON: ${String(err)}`,
    });
    document.diagnostics = diagnostics;
    return document;
  }

  if (!parsed || typeof parsed !== "object") {
    diagnostics.push({
      code: "PL401",
      severity: "error",
      message: "O JSON não representa um objeto no nível raiz.",
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const definition = resolveDefinition(parsed as RawWorkflowDefinition & RawFlowPackage);
  if (!definition) {
    diagnostics.push({
      code: "PL402",
      severity: "error",
      message: 'Não encontrei "triggers"/"actions" no nível raiz nem em "properties.definition".',
      hint: "Formato de definição de fluxo ainda não verificado contra um arquivo real — ver docs/FORMAT-NOTES.md seção 4.",
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const triggerEntries = Object.entries(definition.triggers ?? {});
  if (triggerEntries.length === 0) {
    diagnostics.push({
      code: "PL403",
      severity: "warning",
      message: 'Nenhum gatilho encontrado em "triggers".',
    });
  } else if (triggerEntries.length > 1) {
    diagnostics.push({
      code: "PL404",
      severity: "warning",
      message: `Encontrados ${triggerEntries.length} gatilhos; um fluxo normalmente tem exatamente um. Usando "${triggerEntries[0]![0]}".`,
    });
  }

  const firstTrigger = triggerEntries[0];
  const trigger: FlowNode = firstTrigger
    ? {
        id: firstTrigger[0],
        name: firstTrigger[0],
        type: firstTrigger[1].type ?? "Unknown",
        runAfter: [],
        ...(extractConnectorName(firstTrigger[1].inputs)
          ? { connectorName: extractConnectorName(firstTrigger[1].inputs) }
          : {}),
      }
    : { id: "(sem gatilho)", name: "(sem gatilho)", type: "Unknown", runAfter: [] };

  const actions = flattenActions(definition.actions);
  const connections = buildConnectionRefs(actions, trigger);

  const flowName = source.fileName.replace(/\.json$/i, "");
  const cloudFlow: CloudFlow = {
    kind: "cloudFlow",
    id: flowName,
    name: flowName,
    trigger,
    actions,
    connections,
  };

  document.artifacts = [cloudFlow];
  document.diagnostics = diagnostics;
  return document;
}
