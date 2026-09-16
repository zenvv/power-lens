import { describe, expect, it } from "vitest";
import type { Expression } from "../../src/ir/index.js";
import { pl015LowContrast } from "../../src/rules/pl015-low-contrast.js";
import { canvasApp, control, emptyDocument, formula, literal } from "./helpers.js";

function screenWithLabel(labelProperties: Record<string, Expression>) {
  return {
    name: "Screen1",
    order: 0,
    root: control({
      name: "Screen1",
      type: "Screen",
      children: [control({ name: "Label1", type: "Label", properties: labelProperties })],
    }),
  };
}

describe("pl015LowContrast", () => {
  it("flags near-identical text and background colors", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          screenWithLabel({
            Text: literal("Olá"),
            Fill: formula("=RGBA(255, 255, 255, 1)"),
            Color: formula("=RGBA(250, 250, 250, 1)"),
          }),
        ],
      }),
    ];

    const diagnostics = pl015LowContrast(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.path).toBe("Screen1/Label1");
  });

  it("does not flag black text on a white background", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          screenWithLabel({
            Text: literal("Olá"),
            Fill: formula("=RGBA(255, 255, 255, 1)"),
            Color: formula("=RGBA(0, 0, 0, 1)"),
          }),
        ],
      }),
    ];

    expect(pl015LowContrast(doc)).toHaveLength(0);
  });

  it("does not flag when Fill/Color don't resolve to a constant color", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          screenWithLabel({
            Text: literal("Olá"),
            Fill: formula("=If(varDark, Color.Black, Color.White)"),
            Color: formula("=RGBA(0, 0, 0, 1)"),
          }),
        ],
      }),
    ];

    expect(pl015LowContrast(doc)).toHaveLength(0);
  });

  it("does not flag a semi-transparent color", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          screenWithLabel({
            Text: literal("Olá"),
            Fill: formula("=RGBA(255, 255, 255, 0.5)"),
            Color: formula("=RGBA(250, 250, 250, 1)"),
          }),
        ],
      }),
    ];

    expect(pl015LowContrast(doc)).toHaveLength(0);
  });

  it("does not flag a control with no text", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          screenWithLabel({
            Fill: formula("=RGBA(255, 255, 255, 1)"),
            Color: formula("=RGBA(250, 250, 250, 1)"),
          }),
        ],
      }),
    ];

    expect(pl015LowContrast(doc)).toHaveLength(0);
  });
});
