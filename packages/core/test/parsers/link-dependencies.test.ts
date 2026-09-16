import { describe, expect, it } from "vitest";
import { linkDependencies } from "../../src/parsers/solution/link-dependencies.js";
import { canvasApp, cloudFlow, dataModel, flowNode } from "../rules/helpers.js";
import type { Diagnostic, PowerLensDocument } from "../../src/ir/index.js";

function doc(overrides: Partial<PowerLensDocument> = {}): PowerLensDocument {
  return {
    schemaVersion: "0.1",
    source: { fileName: "Solution.zip", fileSize: 0, detectedFormat: "solution", parsedAt: new Date().toISOString(), parserVersion: "test" },
    artifacts: [],
    diagnostics: [],
    dependencies: [],
    ...overrides,
  };
}

describe("linkDependencies", () => {
  it("links a canvas app data source to a Dataverse table by exact name", () => {
    const document = doc({
      artifacts: [
        canvasApp({ dataSources: [{ name: "accounts", type: "ConnectedDataSourceInfo" }] }),
        dataModel({ id: "dv", tables: [{ name: "accounts", columns: [] }] }),
      ],
    });

    const diagnostics: Diagnostic[] = [];
    const edges = linkDependencies(document, diagnostics);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ toKind: "table", toName: "accounts", confidence: "exact" });
    expect(diagnostics).toHaveLength(0);
  });

  it("links by heuristic substring match when names differ in casing/pluralization", () => {
    const document = doc({
      artifacts: [
        canvasApp({ dataSources: [{ name: "Accounts", type: "ConnectedDataSourceInfo" }] }),
        dataModel({ id: "dv", tables: [{ name: "account", columns: [] }] }),
      ],
    });

    const edges = linkDependencies(document, []);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.confidence).toBe("heuristic");
  });

  it("does not link unrelated names", () => {
    const document = doc({
      artifacts: [
        canvasApp({ dataSources: [{ name: "Pedidos", type: "ConnectedDataSourceInfo" }] }),
        dataModel({ id: "dv", tables: [{ name: "contact", columns: [] }] }),
      ],
    });

    expect(linkDependencies(document, [])).toHaveLength(0);
  });

  it("links a child-flow reference to the matching flow in the same solution", () => {
    const document = doc({
      artifacts: [
        cloudFlow({
          id: "FlowPai",
          actions: [
            flowNode({
              id: "Executar_fluxo_filho",
              type: "Workflow",
              inputs: { host: { workflow: { id: "/providers/Microsoft.ProcessSimple/.../flows/FlowFilho" } } },
            }),
          ],
        }),
        cloudFlow({ id: "FlowFilho", name: "FlowFilho" }),
      ],
    });

    const diagnostics: Diagnostic[] = [];
    const edges = linkDependencies(document, diagnostics);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ fromArtifactId: "FlowPai", toArtifactId: "FlowFilho", toKind: "flow" });
    expect(diagnostics).toHaveLength(0);
  });

  it("emits an info diagnostic when a child-flow reference does not resolve", () => {
    const document = doc({
      artifacts: [
        cloudFlow({
          id: "FlowPai",
          actions: [
            flowNode({
              id: "Executar_fluxo_filho",
              type: "Workflow",
              inputs: { host: { workflow: { id: "/providers/.../flows/FlowInexistente" } } },
            }),
          ],
        }),
      ],
    });

    const diagnostics: Diagnostic[] = [];
    const edges = linkDependencies(document, diagnostics);

    expect(edges).toHaveLength(0);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe("PL310");
  });

  it("returns no edges for a document with no cross-referenceable artifacts", () => {
    const document = doc({ artifacts: [canvasApp()] });
    expect(linkDependencies(document, [])).toHaveLength(0);
  });
});
