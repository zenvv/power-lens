import type { ConnectionRef, FlowNode, RunAfter } from "../../ir/index.js";
import type { RawAction, RawActionInputs, RawRunAfter } from "./raw-shapes.js";

function isActionInputs(value: unknown): value is RawActionInputs {
  return typeof value === "object" && value !== null && "host" in value;
}

/**
 * Best-effort: a connector-backed action's inputs.host carries either an
 * apiId ("/providers/.../apis/shared_sharepointonline") or a bare
 * connectionName. Neither is confirmed against a real file, so this returns
 * undefined rather than guessing when the shape doesn't match.
 */
export function extractConnectorName(inputs: unknown): string | undefined {
  if (!isActionInputs(inputs)) return undefined;
  const host = inputs.host;
  if (!host) return undefined;

  if (host.apiId) {
    const lastSegment = host.apiId.split("/").filter(Boolean).pop();
    if (lastSegment) return lastSegment.replace(/^shared_/, "");
  }

  return host.connectionName;
}

function mapRunAfter(raw: RawRunAfter | undefined): RunAfter[] {
  if (!raw) return [];
  return Object.entries(raw).map(([id, statuses]) => ({ id, statuses }));
}

function buildNode(id: string, action: RawAction, parentId: string | undefined, branch: string | undefined): FlowNode {
  const connectorName = extractConnectorName(action.inputs);
  return {
    id,
    name: id,
    type: action.type ?? "Unknown",
    runAfter: mapRunAfter(action.runAfter),
    ...(parentId ? { parentId } : {}),
    ...(branch ? { branch } : {}),
    ...(connectorName ? { connectorName } : {}),
    ...(action.description ? { summary: action.description } : {}),
  };
}

/**
 * Flattens the nested actions tree (If/Switch/Scope/Foreach all nest their
 * children) into the flat FlowNode[] + parentId/branch shape the IR uses —
 * spec section 5 models a flow's actions as a flat list, hierarchy via
 * parentId.
 */
export function flattenActions(
  actions: Record<string, RawAction> | undefined,
  parentId: string | undefined = undefined,
  branch: string | undefined = undefined,
): FlowNode[] {
  if (!actions) return [];

  const nodes: FlowNode[] = [];

  for (const [id, action] of Object.entries(actions)) {
    nodes.push(buildNode(id, action, parentId, branch));

    if (action.actions) {
      nodes.push(...flattenActions(action.actions, id, action.type === "If" ? "true" : undefined));
    }
    if (action.else?.actions) {
      nodes.push(...flattenActions(action.else.actions, id, "false"));
    }
    if (action.cases) {
      for (const [caseName, caseBody] of Object.entries(action.cases)) {
        nodes.push(...flattenActions(caseBody.actions, id, caseName));
      }
    }
    if (action.default?.actions) {
      nodes.push(...flattenActions(action.default.actions, id, "default"));
    }
  }

  return nodes;
}

export function buildConnectionRefs(actionNodes: readonly FlowNode[], trigger: FlowNode | undefined): ConnectionRef[] {
  const seen = new Map<string, ConnectionRef>();

  const record = (connectorName: string | undefined) => {
    if (!connectorName || seen.has(connectorName)) return;
    seen.set(connectorName, { name: connectorName });
  };

  record(trigger?.connectorName);
  for (const node of actionNodes) {
    record(node.connectorName);
  }

  return [...seen.values()];
}
