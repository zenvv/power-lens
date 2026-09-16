import { describe, expect, it } from "vitest";
import {
  APP_START_NODE,
  buildComponentInventory,
  buildControlReferenceGraph,
  buildScreenNavigationGraph,
} from "../../src/analysis/canvas-app-graphs.js";
import { canvasApp, control, formula, ref } from "../rules/helpers.js";

describe("buildScreenNavigationGraph", () => {
  it("lists every screen and one edge per Navigate() reference found", () => {
    const app = canvasApp({
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
                properties: { OnSelect: formula("Navigate(Screen2)", [ref("screen", "Screen2")]) },
              }),
            ],
          }),
        },
        { name: "Screen2", order: 1, root: control({ name: "Screen2", type: "Screen" }) },
      ],
    });

    const graph = buildScreenNavigationGraph(app);
    expect(graph.screens).toEqual(["Screen1", "Screen2"]);
    expect(graph.edges).toEqual([{ from: "Screen1", to: "Screen2", count: 1 }]);
  });

  it("sums repeated navigation to the same screen into one edge with a count", () => {
    const app = canvasApp({
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
                properties: { OnSelect: formula("Navigate(Screen2)", [ref("screen", "Screen2")]) },
              }),
              control({
                name: "Button2",
                type: "Button",
                properties: { OnSelect: formula("Navigate(Screen2)", [ref("screen", "Screen2")]) },
              }),
            ],
          }),
        },
        { name: "Screen2", order: 1, root: control({ name: "Screen2", type: "Screen" }) },
      ],
    });

    expect(buildScreenNavigationGraph(app).edges).toEqual([{ from: "Screen1", to: "Screen2", count: 2 }]);
  });

  it("does not create a self-loop for navigation to the same screen", () => {
    const app = canvasApp({
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
                properties: { OnSelect: formula("Navigate(Screen1)", [ref("screen", "Screen1")]) },
              }),
            ],
          }),
        },
      ],
    });

    expect(buildScreenNavigationGraph(app).edges).toHaveLength(0);
  });

  it("uses the synthetic App node for navigation triggered in App.OnStart", () => {
    const app = canvasApp({
      screens: [{ name: "Login", order: 0, root: control({ name: "Login", type: "Screen" }) }],
      onStart: formula("Navigate(Login)", [ref("screen", "Login")]),
    });

    expect(buildScreenNavigationGraph(app).edges).toEqual([{ from: APP_START_NODE, to: "Login", count: 1 }]);
  });
});

describe("buildControlReferenceGraph", () => {
  it("emits one edge per distinct reference found across all controls", () => {
    const app = canvasApp({
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
                properties: { Text: formula("Pedidos.Total", [ref("dataSource", "Pedidos")]) },
              }),
            ],
          }),
        },
      ],
    });

    const edges = buildControlReferenceGraph(app);
    expect(edges).toEqual([{ from: "Screen1/Label1", toKind: "dataSource", toName: "Pedidos" }]);
  });

  it("deduplicates the same reference found in more than one property of a control", () => {
    const shared = ref("variable", "varCount");
    const app = canvasApp({
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
                properties: {
                  Text: formula("varCount", [shared]),
                  Visible: formula("varCount > 0", [shared]),
                },
              }),
            ],
          }),
        },
      ],
    });

    expect(buildControlReferenceGraph(app)).toHaveLength(1);
  });
});

describe("buildComponentInventory", () => {
  it("counts usage of a component across screens, including zero-usage components", () => {
    const app = canvasApp({
      components: [{ name: "NavBar", root: control({ name: "NavBar", type: "GroupContainer" }) }, { name: "Unused", root: control({ name: "Unused", type: "GroupContainer" }) }],
      screens: [
        {
          name: "Screen1",
          order: 0,
          root: control({
            name: "Screen1",
            type: "Screen",
            children: [
              control({ name: "NavBar1", type: "NavBar" }),
              control({ name: "NavBar2", type: "NavBar" }),
            ],
          }),
        },
      ],
    });

    const inventory = buildComponentInventory(app);
    expect(inventory).toEqual([
      { name: "NavBar", usageCount: 2 },
      { name: "Unused", usageCount: 0 },
    ]);
  });
});
