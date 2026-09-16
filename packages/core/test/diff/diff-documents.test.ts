import { describe, expect, it } from "vitest";
import { diffDocuments } from "../../src/diff/diff-documents.js";
import { canvasApp, cloudFlow, control, dataModel, emptyDocument, flowNode, formula, literal } from "../rules/helpers.js";
import type { PowerLensDocument } from "../../src/ir/index.js";

function doc(overrides: Partial<PowerLensDocument> = {}): PowerLensDocument {
  return { ...emptyDocument(), ...overrides };
}

describe("diffDocuments — matching by kind+name, not id", () => {
  it("reports no artifacts when the two documents are identical", () => {
    const a = doc({ artifacts: [canvasApp({ id: "app-v1" })] });
    const b = doc({ artifacts: [canvasApp({ id: "app-v2" })] });

    expect(diffDocuments(a, b).artifacts).toHaveLength(0);
  });

  it("marks an artifact present only in b as added", () => {
    const a = doc({ artifacts: [] });
    const b = doc({ artifacts: [canvasApp({ name: "App" })] });

    const diff = diffDocuments(a, b);
    expect(diff.artifacts).toEqual([{ key: "canvasApp:App", kind: "canvasApp", status: "added", entries: [] }]);
  });

  it("marks an artifact present only in a as removed", () => {
    const a = doc({ artifacts: [canvasApp({ name: "App" })] });
    const b = doc({ artifacts: [] });

    const diff = diffDocuments(a, b);
    expect(diff.artifacts).toEqual([{ key: "canvasApp:App", kind: "canvasApp", status: "removed", entries: [] }]);
  });

  it("treats two canvas apps with the same name but different ids as the same artifact", () => {
    const a = doc({ artifacts: [canvasApp({ id: "generated-1", name: "App", appVersion: "1.0" })] });
    const b = doc({ artifacts: [canvasApp({ id: "generated-2", name: "App", appVersion: "1.1" })] });

    const diff = diffDocuments(a, b);
    expect(diff.artifacts).toHaveLength(1);
    expect(diff.artifacts[0]?.status).toBe("changed");
    expect(diff.artifacts[0]?.entries).toContainEqual({
      path: "appVersion",
      kind: "changed",
      before: "1.0",
      after: "1.1",
    });
  });
});

describe("diffDocuments — CanvasApp", () => {
  it("detects a formula that changed on the same control", () => {
    const screenA = {
      name: "Screen1",
      order: 0,
      root: control({
        name: "Screen1",
        type: "Screen",
        children: [control({ name: "Label1", type: "Label", properties: { Text: literal("Olá") } })],
      }),
    };
    const screenB = {
      name: "Screen1",
      order: 0,
      root: control({
        name: "Screen1",
        type: "Screen",
        children: [control({ name: "Label1", type: "Label", properties: { Text: literal("Oi") } })],
      }),
    };

    const diff = diffDocuments(doc({ artifacts: [canvasApp({ screens: [screenA] })] }), doc({ artifacts: [canvasApp({ screens: [screenB] })] }));
    expect(diff.artifacts[0]?.entries).toContainEqual({
      path: "screens[Screen1].root.children[Label1].properties.Text.raw",
      kind: "changed",
      before: "Olá",
      after: "Oi",
    });
  });

  it("detects an added control within an unchanged screen", () => {
    const before = { name: "Screen1", order: 0, root: control({ name: "Screen1", type: "Screen", children: [] }) };
    const after = {
      name: "Screen1",
      order: 0,
      root: control({ name: "Screen1", type: "Screen", children: [control({ name: "Label1", type: "Label" })] }),
    };

    const diff = diffDocuments(doc({ artifacts: [canvasApp({ screens: [before] })] }), doc({ artifacts: [canvasApp({ screens: [after] })] }));
    expect(diff.artifacts[0]?.entries).toContainEqual(
      expect.objectContaining({ path: "screens[Screen1].root.children[Label1]", kind: "added" }),
    );
  });

  it("detects a removed screen as its own entry, not a full-app added/removed", () => {
    const shared = { name: "Screen1", order: 0, root: control({ name: "Screen1", type: "Screen" }) };
    const removedScreen = { name: "Screen2", order: 1, root: control({ name: "Screen2", type: "Screen" }) };

    const diff = diffDocuments(
      doc({ artifacts: [canvasApp({ screens: [shared, removedScreen] })] }),
      doc({ artifacts: [canvasApp({ screens: [shared] })] }),
    );
    expect(diff.artifacts[0]?.status).toBe("changed");
    expect(diff.artifacts[0]?.entries).toContainEqual(
      expect.objectContaining({ path: "screens[Screen2]", kind: "removed" }),
    );
  });
});

describe("diffDocuments — CloudFlow", () => {
  it("matches actions by id and detects a changed runAfter", () => {
    const before = cloudFlow({
      actions: [flowNode({ id: "Enviar_email", type: "OpenApiConnection" })],
    });
    const after = cloudFlow({
      actions: [flowNode({ id: "Enviar_email", type: "OpenApiConnection", runAfter: [{ id: "trigger", statuses: ["Succeeded"] }] })],
    });

    const diff = diffDocuments(doc({ artifacts: [before] }), doc({ artifacts: [after] }));
    expect(diff.artifacts[0]?.entries).toContainEqual(
      expect.objectContaining({ path: "actions[Enviar_email].runAfter", kind: "changed" }),
    );
  });

  it("detects an added action", () => {
    const before = cloudFlow({ actions: [] });
    const after = cloudFlow({ actions: [flowNode({ id: "Novo_passo", type: "Compose" })] });

    const diff = diffDocuments(doc({ artifacts: [before] }), doc({ artifacts: [after] }));
    expect(diff.artifacts[0]?.entries).toContainEqual(
      expect.objectContaining({ path: "actions[Novo_passo]", kind: "added" }),
    );
  });
});

describe("diffDocuments — DataModel", () => {
  it("matches relationships by from+to and detects a cardinality change", () => {
    const rel = {
      from: { table: "Sales", column: "CustomerId" },
      to: { table: "Customers", column: "CustomerId" },
    };
    const before = dataModel({ relationships: [{ ...rel, cardinality: "manyToOne" as const, crossFilter: "single" as const, isActive: true }] });
    const after = dataModel({ relationships: [{ ...rel, cardinality: "oneToOne" as const, crossFilter: "single" as const, isActive: true }] });

    const diff = diffDocuments(doc({ artifacts: [before] }), doc({ artifacts: [after] }));
    expect(diff.artifacts[0]?.entries).toContainEqual({
      path: "relationships[Sales.CustomerId->Customers.CustomerId].cardinality",
      kind: "changed",
      before: "manyToOne",
      after: "oneToOne",
    });
  });

  it("detects a measure expression change, keyed by table+name", () => {
    const before = dataModel({ measures: [{ name: "Total", table: "Sales", expression: "SUM(Sales[Amount])" }] });
    const after = dataModel({ measures: [{ name: "Total", table: "Sales", expression: "SUM(Sales[AmountNet])" }] });

    const diff = diffDocuments(doc({ artifacts: [before] }), doc({ artifacts: [after] }));
    expect(diff.artifacts[0]?.entries).toContainEqual({
      path: "measures[Sales.Total].expression",
      kind: "changed",
      before: "SUM(Sales[Amount])",
      after: "SUM(Sales[AmountNet])",
    });
  });
});

describe("diffDocuments — formula changes reuse the same helper", () => {
  it("ignores an unrelated formula() reference list difference and focuses on raw text", () => {
    const before = { name: "Screen1", order: 0, root: control({ name: "Screen1", type: "Screen", children: [control({ name: "L", type: "Label", properties: { Text: formula("=A") } })] }) };
    const after = { name: "Screen1", order: 0, root: control({ name: "Screen1", type: "Screen", children: [control({ name: "L", type: "Label", properties: { Text: formula("=A") } })] }) };

    const diff = diffDocuments(doc({ artifacts: [canvasApp({ screens: [before] })] }), doc({ artifacts: [canvasApp({ screens: [after] })] }));
    expect(diff.artifacts).toHaveLength(0);
  });
});
