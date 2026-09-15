import { describe, expect, it } from "vitest";
import { pl003UnusedDataSource } from "../../src/rules/pl003-unused-data-source.js";
import { canvasApp, control, emptyDocument, formula, ref } from "./helpers.js";

describe("pl003UnusedDataSource", () => {
  it("flags a data source never referenced by a formula", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        dataSources: [
          { name: "Pedidos", type: "ConnectedDataSourceInfo" },
          { name: "Fornecedores", type: "ConnectedDataSourceInfo" },
        ],
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
                  properties: { Items: formula("=Pedidos", [ref("dataSource", "Pedidos")]) },
                }),
              ],
            }),
          },
        ],
      }),
    ];

    const diagnostics = pl003UnusedDataSource(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("Fornecedores");
  });
});
