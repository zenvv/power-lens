import { createEmptyDocument, type CloudFlow, type Diagnostic, type FlowNode, type PowerLensDocument } from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";
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
export function parseFlow(bytes: Uint8Array, source: FlowSource, locale: Locale = DEFAULT_LOCALE): PowerLensDocument {
  const messages = getMessages(locale).parsers.flow;
  const document = createEmptyDocument({ ...source, detectedFormat: "flow" });
  const diagnostics: Diagnostic[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8").decode(bytes));
  } catch (err) {
    diagnostics.push({
      code: "PL400",
      severity: "error",
      message: messages.invalidJson({ error: String(err) }),
    });
    document.diagnostics = diagnostics;
    return document;
  }

  if (!parsed || typeof parsed !== "object") {
    diagnostics.push({
      code: "PL401",
      severity: "error",
      message: messages.notObjectAtRoot,
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const definition = resolveDefinition(parsed);
  if (!definition) {
    diagnostics.push({
      code: "PL402",
      severity: "error",
      message: messages.definitionNotFound.message,
      hint: messages.definitionNotFound.hint,
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const triggerEntries = Object.entries(definition.triggers ?? {});
  if (triggerEntries.length === 0) {
    diagnostics.push({
      code: "PL403",
      severity: "warning",
      message: messages.noTrigger,
    });
  } else if (triggerEntries.length > 1) {
    diagnostics.push({
      code: "PL404",
      severity: "warning",
      message: messages.multipleTriggers({ count: triggerEntries.length, firstKey: triggerEntries[0]![0] }),
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
        ...(firstTrigger[1].inputs !== undefined ? { inputs: firstTrigger[1].inputs } : {}),
        ...(firstTrigger[1].recurrence !== undefined ? { recurrence: firstTrigger[1].recurrence } : {}),
      }
    : { id: messages.noTriggerFallbackName, name: messages.noTriggerFallbackName, type: "Unknown", runAfter: [] };

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
