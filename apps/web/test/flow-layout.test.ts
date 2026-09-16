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
  it("produces one node per trigger + action + branch container, all with computed positions", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set());

    // trigger + 6 actions (Condition, Send_an_email, Terminate, Scope, Compose, Final_step)
    // + 2 synthetic branch containers (Condition's true/false sides)
    expect(nodes).toHaveLength(9);
    for (const node of nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
      expect(Number.isNaN(node.position.x)).toBe(false);
      expect(Number.isNaN(node.position.y)).toBe(false);
    }
  });

  it("nests an If's true/false children under a synthetic branch container, not the If node directly", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set());

    const trueBranch = nodes.find((n) => n.type === "flowBranch" && n.parentId === "Condition" && n.data.kind === "branch" && n.data.branch === "true");
    const falseBranch = nodes.find((n) => n.type === "flowBranch" && n.parentId === "Condition" && n.data.kind === "branch" && n.data.branch === "false");
    expect(trueBranch).toBeDefined();
    expect(falseBranch).toBeDefined();
    if (trueBranch?.data.kind === "branch") expect(trueBranch.data.ownerType).toBe("If");

    const sendEmail = nodes.find((n) => n.id === "Send_an_email");
    expect(sendEmail?.parentId).toBe(trueBranch?.id);
    expect(sendEmail?.extent).toBe("parent");

    const terminate = nodes.find((n) => n.id === "Terminate");
    expect(terminate?.parentId).toBe(falseBranch?.id);
  });

  it("always renders both sides of an If, marking the side without an else as empty", async () => {
    const raw = {
      triggers: { Manual: { type: "Request" } },
      actions: {
        Only_true_side: {
          type: "If",
          expression: { equals: ["@variables('x')", 1] },
          actions: {
            Send_an_email: { type: "OpenApiConnection", runAfter: {} },
          },
          runAfter: {},
        },
      },
    };
    const bytes = new TextEncoder().encode(JSON.stringify(raw));
    const doc = parseFlow(bytes, { fileName: "flow.json", fileSize: bytes.byteLength });
    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    if (flow?.kind !== "cloudFlow") throw new Error("expected cloudFlow artifact");

    const { nodes } = await layoutFlow(flow, new Set());

    const trueBranch = nodes.find(
      (n) => n.type === "flowBranch" && n.parentId === "Only_true_side" && n.data.kind === "branch" && n.data.branch === "true",
    );
    const falseBranch = nodes.find(
      (n) => n.type === "flowBranch" && n.parentId === "Only_true_side" && n.data.kind === "branch" && n.data.branch === "false",
    );
    expect(trueBranch).toBeDefined();
    expect(falseBranch).toBeDefined();
    if (trueBranch?.data.kind === "branch") expect(trueBranch.data.isEmpty).toBe(false);
    if (falseBranch?.data.kind === "branch") expect(falseBranch.data.isEmpty).toBe(true);
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

  it("lays out left-to-right when direction is RIGHT, still with valid positions", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set(), "RIGHT");

    expect(nodes).toHaveLength(9);
    for (const node of nodes) {
      expect(Number.isNaN(node.position.x)).toBe(false);
      expect(Number.isNaN(node.position.y)).toBe(false);
      expect(node.data.direction).toBe("RIGHT");
    }
  });

  it("defaults to DOWN when no direction is given", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set());

    expect(nodes.every((n) => n.data.direction === "DOWN")).toBe(true);
  });

  it("labels a multi-status runAfter edge but not a plain Succeeded one", async () => {
    const flow = loadFlow();
    const { edges } = await layoutFlow(flow, new Set());

    const multiStatus = edges.find((e) => e.source === "Scope" && e.target === "Final_step");
    expect(multiStatus?.label).toBe("Succeeded, Skipped");

    const plainSucceeded = edges.find((e) => e.source === "Condition" && e.target === "Scope");
    expect(plainSucceeded?.label).toBeUndefined();
  });

  it("marks only the trigger node as isTrigger", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set());

    const trigger = nodes.find((n) => n.id === flow.trigger.id);
    expect(trigger?.data.isTrigger).toBe(true);
    expect(nodes.filter((n) => n.data.isTrigger)).toHaveLength(1);
  });

  it("marks every action nothing runs after as isEnd, one per branch", async () => {
    const flow = loadFlow();
    const { nodes } = await layoutFlow(flow, new Set());

    const endIds = nodes.filter((n) => n.data.isEnd).map((n) => n.id).sort();
    expect(endIds).toEqual(["Compose", "Final_step", "Send_an_email", "Terminate"].sort());

    // Condition/Scope têm outra action rodando depois delas — não são fim.
    expect(nodes.find((n) => n.id === "Condition")?.data.isEnd).toBe(false);
    expect(nodes.find((n) => n.id === "Scope")?.data.isEnd).toBe(false);
  });
});
