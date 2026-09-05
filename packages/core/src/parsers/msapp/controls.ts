import type { Control, Diagnostic, Expression } from "../../ir/index.js";
import type { RawControlNode, RawScreenOrComponentDef } from "./raw-shapes.js";

/**
 * A control's type + version is encoded as "Type@major.minor.patch" (e.g.
 * "GroupContainer@1.5.0") — docs/FORMAT-NOTES.md section 1.4. A component
 * instance's own Control value is always the literal "CanvasComponent";
 * ComponentName carries the real identity, which we surface as `type`
 * instead of the generic instance marker so it isn't lost.
 */
export function resolveControlType(node: RawControlNode): string {
  if (typeof node.ComponentName === "string" && node.ComponentName.length > 0) {
    return node.ComponentName;
  }
  const raw = typeof node.Control === "string" ? node.Control : "Unknown";
  const at = raw.indexOf("@");
  return at === -1 ? raw : raw.slice(0, at);
}

/**
 * A property value is normally a YAML string starting with "=" (formula or
 * literal wrapped as a formula). Guards for the value not being a string at
 * all, since docs/FORMAT-NOTES.md section 1.8 notes Properties values aren't
 * guaranteed to always be formula strings.
 */
export function mapExpression(value: unknown): Expression {
  if (typeof value !== "string") {
    const literal =
      typeof value === "number" || typeof value === "boolean" ? value : undefined;
    return { raw: JSON.stringify(value) ?? "null", kind: "literal", literal, references: [] };
  }

  if (!value.startsWith("=")) {
    return { raw: value, kind: "literal", literal: value, references: [] };
  }

  const body = value.slice(1);

  const stringLiteral = /^"([^"]*)"$/.exec(body);
  if (stringLiteral?.[1] !== undefined) {
    return { raw: value, kind: "literal", literal: stringLiteral[1], references: [] };
  }

  if (/^-?\d+(\.\d+)?$/.test(body)) {
    return { raw: value, kind: "literal", literal: Number(body), references: [] };
  }

  if (body === "true" || body === "false") {
    return { raw: value, kind: "literal", literal: body === "true", references: [] };
  }

  // References are filled in later, once the whole document's symbol table
  // (screens/controls/dataSources/variables) is known — see walk.ts.
  return { raw: value, kind: "formula", references: [] };
}

export function mapProperties(raw: Record<string, unknown> | undefined): Record<string, Expression> {
  const result: Record<string, Expression> = {};
  if (!raw) return result;
  for (const [key, value] of Object.entries(raw)) {
    result[key] = mapExpression(value);
  }
  return result;
}

export function mapChildren(rawChildren: unknown[] | undefined, diagnostics: Diagnostic[]): Control[] {
  if (!rawChildren) return [];

  const controls: Control[] = [];
  for (const child of rawChildren) {
    if (!child || typeof child !== "object") {
      diagnostics.push({
        code: "PL108",
        severity: "warning",
        message: "Item de Children não é um objeto; ignorado.",
      });
      continue;
    }

    const entries = Object.entries(child as Record<string, RawControlNode>);
    const first = entries[0];
    if (!first) {
      diagnostics.push({
        code: "PL108",
        severity: "warning",
        message: "Item de Children é um objeto vazio; ignorado.",
      });
      continue;
    }

    const [name, node] = first;
    controls.push(mapControl(name, node ?? {}, diagnostics));
  }
  return controls;
}

export function mapControl(name: string, node: RawControlNode, diagnostics: Diagnostic[]): Control {
  return {
    name,
    type: resolveControlType(node),
    properties: mapProperties(node.Properties),
    children: mapChildren(node.Children, diagnostics),
  };
}

/**
 * Screens and components don't have a single root control in the raw
 * format — Screens.<name> and ComponentDefinitions.<name> each carry their
 * own Properties + a flat Children list (spec section 5 models Screen.root
 * as a single Control tree). We synthesize that root from the screen/
 * component's own name, type, properties and children.
 */
export function mapRoot(
  name: string,
  type: string,
  def: RawScreenOrComponentDef,
  diagnostics: Diagnostic[],
): Control {
  return {
    name,
    type,
    properties: mapProperties(def.Properties),
    children: mapChildren(def.Children, diagnostics),
  };
}
