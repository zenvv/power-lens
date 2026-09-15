import { describe, expect, it } from "vitest";
import { pl001OrphanScreen } from "../../src/rules/pl001-orphan-screen.js";
import { canvasApp, control, emptyDocument, formula, ref } from "./helpers.js";

describe("pl001OrphanScreen", () => {
  it("flags a screen no navigation references, but not the home screen or a referenced one", () => {
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
                  name: "Button1",
                  type: "Button",
                  properties: { OnSelect: formula("=Navigate(Screen2)", [ref("screen", "Screen2")]) },
                }),
              ],
            }),
          },
          { name: "Screen2", order: 1, root: control({ name: "Screen2", type: "Screen" }) },
          { name: "Screen3", order: 2, root: control({ name: "Screen3", type: "Screen" }) },
        ],
      }),
    ];

    const diagnostics = pl001OrphanScreen(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.path).toBe("Screen3");
    expect(diagnostics[0]?.code).toBe("PL001");
  });

  it("counts a screen reference from App.OnStart", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        onStart: formula("=Navigate(Screen2)", [ref("screen", "Screen2")]),
        screens: [
          { name: "Screen1", order: 0, root: control({ name: "Screen1", type: "Screen" }) },
          { name: "Screen2", order: 1, root: control({ name: "Screen2", type: "Screen" }) },
        ],
      }),
    ];

    expect(pl001OrphanScreen(doc)).toHaveLength(0);
  });
});
