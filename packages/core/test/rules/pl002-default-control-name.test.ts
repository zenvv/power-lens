import { describe, expect, it } from "vitest";
import { pl002DefaultControlName } from "../../src/rules/pl002-default-control-name.js";
import { canvasApp, control, emptyDocument } from "./helpers.js";

describe("pl002DefaultControlName", () => {
  it("flags a control left with the Studio default name", () => {
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
              children: [control({ name: "Label1", type: "Label" })],
            }),
          },
        ],
      }),
    ];

    const diagnostics = pl002DefaultControlName(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.path).toBe("Screen1/Label1");
  });

  it("does not flag a renamed control", () => {
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
              children: [control({ name: "lblGreeting", type: "Label" })],
            }),
          },
        ],
      }),
    ];

    expect(pl002DefaultControlName(doc)).toHaveLength(0);
  });
});
