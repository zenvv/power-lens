import { describe, expect, it } from "vitest";
import { pl004HardcodedGuid } from "../../src/rules/pl004-hardcoded-guid.js";
import { canvasApp, control, emptyDocument, formula } from "./helpers.js";

describe("pl004HardcodedGuid", () => {
  it("flags a GUID literal hardcoded in a formula", () => {
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
                control({
                  name: "Label1",
                  type: "Label",
                  properties: { Text: formula('="328fc949-1234-4a2b-8c3d-000000000000"') },
                }),
              ],
            }),
          },
        ],
      }),
    ];

    const diagnostics = pl004HardcodedGuid(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.path).toBe("Screen1/Label1.Text");
  });

  it("does not flag a formula with no GUID-shaped text", () => {
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
              children: [control({ name: "Label1", type: "Label", properties: { Text: formula('="hello"') } })],
            }),
          },
        ],
      }),
    ];

    expect(pl004HardcodedGuid(doc)).toHaveLength(0);
  });
});
