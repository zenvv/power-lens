import type { Control } from "../../ir/index.js";

export function renderControlTree(control: Control, depth = 0): string {
  const indent = "  ".repeat(depth);
  const line = `${indent}- **${control.name}** _(${control.type})_`;
  const children = control.children.map((child) => renderControlTree(child, depth + 1));
  return [line, ...children].join("\n");
}
