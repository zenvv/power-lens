import { describe, expect, it } from "vitest";
import { pl007EmptyAccessibleLabel } from "../../src/rules/pl007-empty-accessible-label.js";
import { canvasApp, control, emptyDocument, literal } from "./helpers.js";

describe("pl007EmptyAccessibleLabel", () => {
  it("flags an Icon with no AccessibleLabel at all", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          {
            name: "Screen1",
            order: 0,
            root: control({ name: "Screen1", type: "Screen", children: [control({ name: "Icon1", type: "Icon" })] }),
          },
        ],
      }),
    ];

    expect(pl007EmptyAccessibleLabel(doc)).toHaveLength(1);
  });

  it("flags an Icon with an explicitly empty AccessibleLabel", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          {
            name: "Screen1",
            order: 0,
            root: control({
              name: "Screen1",
              type: "Screen",
              children: [control({ name: "Icon1", type: "Icon", properties: { AccessibleLabel: literal("") } })],
            }),
          },
        ],
      }),
    ];

    expect(pl007EmptyAccessibleLabel(doc)).toHaveLength(1);
  });

  it("does not flag an Icon with a real AccessibleLabel", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          {
            name: "Screen1",
            order: 0,
            root: control({
              name: "Screen1",
              type: "Screen",
              children: [
                control({ name: "Icon1", type: "Icon", properties: { AccessibleLabel: literal("Fechar") } }),
              ],
            }),
          },
        ],
      }),
    ];

    expect(pl007EmptyAccessibleLabel(doc)).toHaveLength(0);
  });

  it("does not flag a control type outside the interactive list (e.g. Label)", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          {
            name: "Screen1",
            order: 0,
            root: control({ name: "Screen1", type: "Screen", children: [control({ name: "Label1", type: "Label" })] }),
          },
        ],
      }),
    ];

    expect(pl007EmptyAccessibleLabel(doc)).toHaveLength(0);
  });
});
