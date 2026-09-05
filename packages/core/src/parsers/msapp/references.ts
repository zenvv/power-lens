import type { Reference, VariableUsage } from "../../ir/index.js";

/**
 * RASA (regex/tokenization) extraction, deliberately not a Power Fx grammar
 * parser — see spec Prompt 4 instructions and docs/FORMAT-NOTES.md section 5
 * (CMPA never wrote a real Power Fx parser either, only narrow regexes).
 */

const SET_RE = /\bSet\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/g;
const COLLECT_RE = /\b(?:Clear)?Collect\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/g;
const UPDATE_CONTEXT_RE = /\bUpdateContext\(\s*\{([^}]*)\}/g;
const OBJECT_KEY_RE = /([A-Za-z_][A-Za-z0-9_]*)\s*:/g;

/**
 * Scans Set/Collect/ClearCollect/UpdateContext call sites to discover
 * variable and collection names — this is what feeds CanvasApp.variables
 * (spec: "inferido de Set/UpdateContext/Collect") and also becomes the
 * symbol table extractReferences() uses to classify later usages.
 */
export function extractVariableUsages(formulaBodies: readonly string[]): VariableUsage[] {
  const found = new Map<string, VariableUsage>();

  function record(name: string, kind: VariableUsage["kind"]) {
    const key = `${kind}:${name}`;
    if (!found.has(key)) found.set(key, { name, kind });
  }

  for (const body of formulaBodies) {
    for (const match of body.matchAll(SET_RE)) {
      const name = match[1];
      if (name) record(name, "variable");
    }
    for (const match of body.matchAll(COLLECT_RE)) {
      const name = match[1];
      if (name) record(name, "collection");
    }
    for (const match of body.matchAll(UPDATE_CONTEXT_RE)) {
      const inner = match[1];
      if (!inner) continue;
      for (const keyMatch of inner.matchAll(OBJECT_KEY_RE)) {
        const name = keyMatch[1];
        if (name) record(name, "contextVariable");
      }
    }
  }

  return [...found.values()];
}

export type ReferenceContext = {
  controlNames: ReadonlySet<string>;
  screenNames: ReadonlySet<string>;
  dataSourceNames: ReadonlySet<string>;
  variableNames: ReadonlySet<string>;
  collectionNames: ReadonlySet<string>;
};

const IDENTIFIER_RE = /'([^']+)'|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;

/**
 * Classifies each identifier token in a formula body against the document's
 * known names. An identifier that matches nothing known is left
 * unclassified rather than guessed — spec Prompt 4: "se um identificador for
 * ambíguo, prefira não classificar a classificar errado". This means plain
 * property accesses (ThisItem.Foo, Self.Width) and genuinely free variables
 * we have no other evidence for never produce a Reference.
 */
export function extractReferences(formulaBody: string, ctx: ReferenceContext): Reference[] {
  const found = new Map<string, Reference>();

  for (const match of formulaBody.matchAll(IDENTIFIER_RE)) {
    const name = match[1] ?? match[2];
    if (!name || match.index === undefined) continue;

    const afterIndex = match.index + match[0].length;
    const isCall = /^\s*\(/.test(formulaBody.slice(afterIndex));
    const precedingChar = match.index > 0 ? formulaBody[match.index - 1] : undefined;
    const isMethodStyle = precedingChar === ".";

    let kind: Reference["kind"] | undefined;
    if (isCall && !isMethodStyle) {
      kind = "function";
    } else if (ctx.screenNames.has(name)) {
      kind = "screen";
    } else if (ctx.controlNames.has(name)) {
      kind = "control";
    } else if (ctx.dataSourceNames.has(name)) {
      kind = "dataSource";
    } else if (ctx.variableNames.has(name)) {
      kind = "variable";
    } else if (ctx.collectionNames.has(name)) {
      kind = "collection";
    }

    if (!kind) continue;
    const key = `${kind}:${name}`;
    if (!found.has(key)) found.set(key, { kind, name });
  }

  return [...found.values()];
}
