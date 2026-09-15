import { describe, expect, it } from "vitest";
import { pl009PremiumConnector } from "../../src/rules/pl009-premium-connector.js";
import { canvasApp, emptyDocument } from "./helpers.js";

describe("pl009PremiumConnector", () => {
  it("flags a known premium connector", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        dataSources: [{ name: "Pedidos", type: "ConnectedDataSourceInfo", connectorId: "sql" }],
      }),
    ];

    const diagnostics = pl009PremiumConnector(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("sql");
  });

  it("does not flag a standard connector", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        dataSources: [{ name: "Pedidos", type: "ConnectedDataSourceInfo", connectorId: "sharepointonline" }],
      }),
    ];

    expect(pl009PremiumConnector(doc)).toHaveLength(0);
  });

  it("does not flag a data source with no known connectorId", () => {
    const doc = emptyDocument();
    doc.artifacts = [canvasApp({ dataSources: [{ name: "Pedidos", type: "ConnectedDataSourceInfo" }] })];

    expect(pl009PremiumConnector(doc)).toHaveLength(0);
  });
});
