import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateDocument } from "../../src/ir/index.js";
import { parseFlow } from "../../src/parsers/flow/index.js";

const FIXTURE_PATH = resolve(__dirname, "../../../../fixtures/synthetic/flow-minimal/definition.json");

function parseFixture() {
  const bytes = readFileSync(FIXTURE_PATH);
  return parseFlow(bytes, { fileName: "definition.json", fileSize: bytes.byteLength });
}

describe("parseFlow — trigger", () => {
  it("reads the single trigger's name, type and connector", () => {
    const doc = parseFixture();
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    expect(flow?.kind).toBe("cloudFlow");
    if (flow?.kind !== "cloudFlow") return;

    expect(flow.trigger.name).toBe("When_an_item_is_created");
    expect(flow.trigger.type).toBe("OpenApiConnection");
    expect(flow.trigger.connectorName).toBe("sharepointonline");
  });
});

describe("parseFlow — actions", () => {
  it("flattens nested actions with parentId, preserving all six non-trigger nodes", () => {
    const doc = parseFixture();
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");

    expect(flow.actions).toHaveLength(6);
    const names = flow.actions.map((a) => a.id).sort();
    expect(names).toEqual(
      ["Compose", "Condition", "Final_step", "Scope", "Send_an_email", "Terminate"].sort(),
    );
  });

  it("marks the If's true/false branches distinctly via `branch`", () => {
    const doc = parseFixture();
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");

    const sendEmail = flow.actions.find((a) => a.id === "Send_an_email");
    const terminate = flow.actions.find((a) => a.id === "Terminate");
    expect(sendEmail?.parentId).toBe("Condition");
    expect(sendEmail?.branch).toBe("true");
    expect(terminate?.parentId).toBe("Condition");
    expect(terminate?.branch).toBe("false");
  });

  it("does not set branch for a plain Scope child", () => {
    const doc = parseFixture();
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");

    const compose = flow.actions.find((a) => a.id === "Compose");
    expect(compose?.parentId).toBe("Scope");
    expect(compose?.branch).toBeUndefined();
  });

  it("captures runAfter edges, including multi-status ones", () => {
    const doc = parseFixture();
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");

    const finalStep = flow.actions.find((a) => a.id === "Final_step");
    expect(finalStep?.runAfter).toEqual([{ id: "Scope", statuses: ["Succeeded", "Skipped"] }]);
  });

  it("uses an action's description as its summary", () => {
    const doc = parseFixture();
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");

    const finalStep = flow.actions.find((a) => a.id === "Final_step");
    expect(finalStep?.summary).toBe("Atualiza o status final do item na lista");
  });
});

describe("parseFlow — connections", () => {
  it("deduplicates connector names across trigger and actions", () => {
    const doc = parseFixture();
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");

    const names = flow.connections.map((c) => c.name).sort();
    expect(names).toEqual(["office365", "sharepointonline"]);
  });
});

describe("parseFlow — wrapped shape (properties.definition)", () => {
  it("also parses a flow-package-wrapped definition", () => {
    const wrapped = {
      properties: {
        definition: {
          triggers: { Manual: { type: "Request" } },
          actions: { Respond: { type: "Response", runAfter: {} } },
        },
      },
    };
    const bytes = new TextEncoder().encode(JSON.stringify(wrapped));
    const doc = parseFlow(bytes, { fileName: "flow.json", fileSize: bytes.byteLength });

    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");
    expect(flow.trigger.name).toBe("Manual");
    expect(flow.actions).toHaveLength(1);
  });
});

describe("parseFlow — output validity", () => {
  it("produces a document that passes the IR schema", () => {
    const doc = parseFixture();
    expect(validateDocument(doc).ok).toBe(true);
  });

  it("never throws on invalid JSON", () => {
    const bytes = new TextEncoder().encode("not json at all {{{");
    const doc = parseFlow(bytes, { fileName: "broken.json", fileSize: bytes.byteLength });
    expect(doc.diagnostics.some((d) => d.severity === "error")).toBe(true);
    expect(validateDocument(doc).ok).toBe(true);
  });

  it("never throws on valid JSON that isn't a recognizable flow definition", () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ hello: "world" }));
    const doc = parseFlow(bytes, { fileName: "not-a-flow.json", fileSize: bytes.byteLength });
    expect(doc.diagnostics.some((d) => d.code === "PL402")).toBe(true);
    expect(validateDocument(doc).ok).toBe(true);
  });
});
