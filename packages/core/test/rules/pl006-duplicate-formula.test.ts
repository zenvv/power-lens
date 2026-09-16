import { describe, expect, it } from "vitest";
import { pl006DuplicateFormula } from "../../src/rules/pl006-duplicate-formula.js";
import { canvasApp, control, emptyDocument, formula } from "./helpers.js";

describe("pl006DuplicateFormula", () => {
  it("flags an identical formula repeated across 3+ controls", () => {
    const doc = emptyDocument();
    const shared = formula('=If(User().Email = "admin@contoso.com", true, false)');
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
                control({ name: "Button1", type: "Button", properties: { Visible: shared } }),
                control({ name: "Button2", type: "Button", properties: { Visible: shared } }),
                control({ name: "Button3", type: "Button", properties: { Visible: shared } }),
              ],
            }),
          },
        ],
      }),
    ];

    const diagnostics = pl006DuplicateFormula(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.hint).toContain("Button1");
    expect(diagnostics[0]?.hint).toContain("Button3");
  });

  it("does not flag a formula repeated only twice", () => {
    const doc = emptyDocument();
    const shared = formula("=true");
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
                control({ name: "Button1", type: "Button", properties: { Visible: shared } }),
                control({ name: "Button2", type: "Button", properties: { Visible: shared } }),
              ],
            }),
          },
        ],
      }),
    ];

    expect(pl006DuplicateFormula(doc)).toHaveLength(0);
  });

  it("respects a custom minOccurrences option", () => {
    const doc = emptyDocument();
    const shared = formula("=true");
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
                control({ name: "Button1", type: "Button", properties: { Visible: shared } }),
                control({ name: "Button2", type: "Button", properties: { Visible: shared } }),
              ],
            }),
          },
        ],
      }),
    ];

    expect(pl006DuplicateFormula(doc)).toHaveLength(0);
    expect(pl006DuplicateFormula(doc, { minOccurrences: 2 })).toHaveLength(1);
  });
});
