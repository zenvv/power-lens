import { describe, expect, it } from "vitest";
import { pl011UnhandledCriticalAction } from "../../src/rules/pl011-unhandled-critical-action.js";
import { cloudFlow, emptyDocument, flowNode } from "./helpers.js";

describe("pl011UnhandledCriticalAction", () => {
  it("flags an Http action with no step handling its failure", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        actions: [flowNode({ id: "Chamar_API", type: "Http" })],
      }),
    ];

    const diagnostics = pl011UnhandledCriticalAction(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("Chamar_API");
  });

  it("flags a premium-connector action with no failure handling", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        actions: [flowNode({ id: "Consultar_SQL", type: "OpenApiConnection", connectorName: "sql" })],
      }),
    ];

    expect(pl011UnhandledCriticalAction(doc)).toHaveLength(1);
  });

  it("does not flag when a later step handles the failure", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        actions: [
          flowNode({ id: "Chamar_API", type: "Http" }),
          flowNode({
            id: "Tratar_erro",
            type: "Compose",
            runAfter: [{ id: "Chamar_API", statuses: ["Failed", "TimedOut"] }],
          }),
        ],
      }),
    ];

    expect(pl011UnhandledCriticalAction(doc)).toHaveLength(0);
  });

  it("does not flag a non-critical action", () => {
    const doc = emptyDocument();
    doc.artifacts = [cloudFlow({ actions: [flowNode({ id: "Compor_texto", type: "Compose" })] })];

    expect(pl011UnhandledCriticalAction(doc)).toHaveLength(0);
  });
});
