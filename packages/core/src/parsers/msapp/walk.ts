import type { Component, Control, Screen } from "../../ir/index.js";
import { extractReferences, type ReferenceContext } from "./references.js";

export function walkControls(roots: readonly Control[], visit: (control: Control) => void): void {
  for (const control of roots) {
    visit(control);
    walkControls(control.children, visit);
  }
}

function allRoots(screens: readonly Screen[], components: readonly Component[]): Control[] {
  return [...screens.map((s) => s.root), ...components.map((c) => c.root)];
}

export function collectControlNames(screens: readonly Screen[], components: readonly Component[]): Set<string> {
  const names = new Set<string>();
  walkControls(allRoots(screens, components), (control) => names.add(control.name));
  return names;
}

export function collectFormulaBodies(screens: readonly Screen[], components: readonly Component[]): string[] {
  const bodies: string[] = [];
  walkControls(allRoots(screens, components), (control) => {
    for (const expression of Object.values(control.properties)) {
      if (expression.kind === "formula") {
        bodies.push(expression.raw.slice(1));
      }
    }
  });
  return bodies;
}

export function finalizeReferences(
  screens: readonly Screen[],
  components: readonly Component[],
  ctx: ReferenceContext,
): void {
  walkControls(allRoots(screens, components), (control) => {
    for (const expression of Object.values(control.properties)) {
      if (expression.kind === "formula") {
        expression.references = extractReferences(expression.raw.slice(1), ctx);
      }
    }
  });
}
