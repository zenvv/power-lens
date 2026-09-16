import { describe, expect, it } from "vitest";
import { buildSearchIndex, searchIndex } from "../../src/search/build-search-index.js";
import { canvasApp, cloudFlow, control, dataModel, emptyDocument, flowNode, formula, ref } from "../rules/helpers.js";

describe("buildSearchIndex", () => {
  it("indexes screens, controls, and their formula references in a canvas app", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        dataSources: [{ name: "Pedidos", type: "ConnectedDataSourceInfo" }],
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
      }),
    ];

    const index = buildSearchIndex(doc);
    expect(index.some((e) => e.kind === "screen" && e.name === "Screen1")).toBe(true);
    expect(index.some((e) => e.kind === "control" && e.name === "Label1")).toBe(true);
    expect(index.some((e) => e.kind === "dataSource" && e.name === "Pedidos" && e.path === "Pedidos")).toBe(true);
    expect(
      index.some((e) => e.kind === "dataSource" && e.name === "Pedidos" && e.path === "Screen1/Label1.Text"),
    ).toBe(true);
  });

  it("indexes a cloud flow's trigger, actions and connections", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        trigger: flowNode({ id: "Quando_criado", type: "Recurrence" }),
        actions: [flowNode({ id: "Enviar_email", type: "OpenApiConnection", connectorName: "office365" })],
        connections: [{ name: "office365", connectorName: "office365" }],
      }),
    ];

    const index = buildSearchIndex(doc);
    expect(index.some((e) => e.kind === "flowTrigger" && e.name === "Quando_criado")).toBe(true);
    expect(index.some((e) => e.kind === "flowAction" && e.name === "Enviar_email")).toBe(true);
    expect(index.some((e) => e.kind === "connection" && e.name === "office365")).toBe(true);
  });

  it("indexes a data model's tables, columns and measures", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        tables: [{ name: "Sales", columns: [{ name: "Amount", dataType: "decimal", isCalculated: false }] }],
        measures: [{ name: "Total", table: "Sales", expression: "SUM(Sales[Amount])" }],
      }),
    ];

    const index = buildSearchIndex(doc);
    expect(index.some((e) => e.kind === "table" && e.name === "Sales")).toBe(true);
    expect(index.some((e) => e.kind === "column" && e.name === "Amount" && e.path === "Sales.Amount")).toBe(true);
    expect(index.some((e) => e.kind === "measure" && e.name === "Total")).toBe(true);
  });
});

describe("searchIndex", () => {
  it("matches by case-insensitive substring", () => {
    const doc = emptyDocument();
    doc.artifacts = [dataModel({ tables: [{ name: "Customers", columns: [] }] })];
    const index = buildSearchIndex(doc);

    expect(searchIndex(index, "custom")).toHaveLength(1);
    expect(searchIndex(index, "CUSTOM")).toHaveLength(1);
    expect(searchIndex(index, "zzz")).toHaveLength(0);
  });

  it("returns nothing for an empty query", () => {
    const doc = emptyDocument();
    doc.artifacts = [dataModel({ tables: [{ name: "Customers", columns: [] }] })];
    expect(searchIndex(buildSearchIndex(doc), "  ")).toHaveLength(0);
  });
});
