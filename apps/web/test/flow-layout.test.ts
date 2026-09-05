import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseFlow } from "@power-lens/core";
import { describe, expect, it } from "vitest";
import { layoutFlow } from "../src/lib/flow-layout.js";

const FIXTURE_PATH = resolve(__dirname, "../../../fixtures/synthetic/flow-minimal/definition.json");

function loadFlow() {
  const bytes = readFileSync(FIXTURE_PATH);
  const doc = parseFlow(bytes, { fileName: "definition.json", fileSize: bytes.byteLength });
  const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
  if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");
  return flow;
}

describe("layoutFlow", () => {
  it("produces one node per trigger + action, all with computed positions", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set());

    // trigger + 6 actions (Condition, Send_an_email, Terminate, Scope, Compose, Final_step)
    expect(nodes).toHaveLength(7);
    for (const node of nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
      expect(Number.isNaN(node.position.x)).toBe(false);
      expect(Number.isNaN(node.position.y)).toBe(false);
    }
  });

  it("nests branch children under their If node via parentId", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set());

    const sendEmail = nodes.find((n) => n.id === "Send_an_email");
    expect(sendEmail?.parentId).toBe("Condition");
    expect(sendEmail?.extent).toBe("parent");
  });

  it("collapsing a group removes its children from the node list", async () => {
    const flow = loadFlow();
    const expanded = await layoutFlow(flow, new Set());
    const collapsed = await layoutFlow(flow, new Set(["Condition"]));

    expect(expanded.nodes.some((n) => n.id === "Send_an_email")).toBe(true);
    expect(collapsed.nodes.some((n) => n.id === "Send_an_email")).toBe(false);
    expect(collapsed.nodes.some((n) => n.id === "Condition")).toBe(true);

    const conditionNode = collapsed.nodes.find((n) => n.id === "Condition");
    expect(conditionNode?.data.collapsed).toBe(true);
  });

  it("creates an edge from the trigger to a top-level action with no runAfter", async () => {
    const flow = loadFlow();
    const { edges } = await layoutFlow(flow, new Set());

    expect(edges.some((e) => e.source === flow.trigger.id && e.target === "Condition")).toBe(true);
  });

  it("labels a multi-status runAfter edge but not a plain Succeeded one", async () => {
    const flow = loadFlow();
    const { edges } = await layoutFlow(flow, new Set());

    const multiStatus = edges.find((e) => e.source === "Scope" && e.target === "Final_step");
    expect(multiStatus?.label).toBe("Succeeded, Skipped");

    const plainSucceeded = edges.find((e) => e.source === "Condition" && e.target === "Scope");
    expect(plainSucceeded?.label).toBeUndefined();
  });
});
