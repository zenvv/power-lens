import type { CanvasApp, Control, Expression } from "../ir/index.js";

/**
 * Visita cada `Control` de um `CanvasApp` (telas + componentes), com o path
 * tipo "Screen1/Gallery1/Label3" (spec: `Diagnostic.path`) já montado —
 * réplica pequena e local do walker de `parsers/msapp/walk.ts`: as regras
 * de health check operam sobre o IR, não sobre o arquivo bruto, então não
 * têm razão pra depender de um módulo de parser específico (regra de
 * arquitetura 1 do CLAUDE.md é sobre não ler o arquivo bruto fora de
 * parsers/, não sobre reusar tipos do IR).
 */
export function forEachControl(app: CanvasApp, visit: (control: Control, path: string) => void): void {
  function walk(control: Control, parentPath: string): void {
    const path = parentPath ? `${parentPath}/${control.name}` : control.name;
    visit(control, path);
    for (const child of control.children) walk(child, path);
  }

  for (const screen of app.screens) walk(screen.root, "");
  for (const component of app.components) walk(component.root, "");
}

/** Visita cada `Expression` de cada controle, junto do nome da propriedade
 * dona dela — a maioria das regras opera em propriedade, não em controle. */
export function forEachExpression(
  app: CanvasApp,
  visit: (expression: Expression, propertyName: string, control: Control, path: string) => void,
): void {
  forEachControl(app, (control, path) => {
    for (const [propertyName, expression] of Object.entries(control.properties)) {
      visit(expression, propertyName, control, path);
    }
  });
}
