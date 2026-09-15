import { describe, expect, it } from "vitest";
import { pl008NonDelegableFunction } from "../../src/rules/pl008-non-delegable-function.js";
import { canvasApp, control, emptyDocument, formula, ref } from "./helpers.js";

describe("pl008NonDelegableFunction", () => {
  it("flags ForAll applied over a remote data source", () => {
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
                  properties: {
                    OnSelect: formula("=ForAll(Pedidos, Collect(Local, ThisRecord))", [
                      ref("function", "ForAll"),
                      ref("dataSource", "Pedidos"),
                    ]),
                  },
                }),
              ],
            }),
          },
        ],
      }),
    ];

    const diagnostics = pl008NonDelegableFunction(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("PL008");
  });

  it("does not flag ForAll over a local collection (no dataSource reference)", () => {
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
                  properties: {
                    OnSelect: formula("=ForAll(LocalCollection, Collect(Local, ThisRecord))", [
                      ref("function", "ForAll"),
                      ref("collection", "LocalCollection"),
                    ]),
                  },
                }),
              ],
            }),
          },
        ],
      }),
    ];

    expect(pl008NonDelegableFunction(doc)).toHaveLength(0);
  });

  it("does not flag a delegable function like Filter", () => {
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
                  name: "Gallery1",
                  type: "Gallery",
                  properties: {
                    Items: formula('=Filter(Pedidos, Status = "Aberto")', [
                      ref("function", "Filter"),
                      ref("dataSource", "Pedidos"),
                    ]),
                  },
                }),
              ],
            }),
          },
        ],
      }),
    ];

    expect(pl008NonDelegableFunction(doc)).toHaveLength(0);
  });
});
