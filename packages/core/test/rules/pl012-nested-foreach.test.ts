import { describe, expect, it } from "vitest";
import { pl012NestedForeach } from "../../src/rules/pl012-nested-foreach.js";
import { cloudFlow, emptyDocument, flowNode } from "./helpers.js";

describe("pl012NestedForeach", () => {
  it("flags a Foreach directly nested inside another Foreach", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        actions: [
          flowNode({ id: "Externo", type: "Foreach" }),
          flowNode({ id: "Interno", type: "Foreach", parentId: "Externo" }),
        ],
      }),
    ];

    const diagnostics = pl012NestedForeach(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("Interno");
  });

  it("flags a Foreach nested through an intermediate Scope", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        actions: [
          flowNode({ id: "Externo", type: "Foreach" }),
          flowNode({ id: "Bloco", type: "Scope", parentId: "Externo" }),
          flowNode({ id: "Interno", type: "Foreach", parentId: "Bloco" }),
        ],
      }),
    ];

    expect(pl012NestedForeach(doc)).toHaveLength(1);
  });

  it("does not flag two Foreach at the same level", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        actions: [flowNode({ id: "Primeiro", type: "Foreach" }), flowNode({ id: "Segundo", type: "Foreach" })],
      }),
    ];

    expect(pl012NestedForeach(doc)).toHaveLength(0);
  });

  it("does not flag a Foreach nested inside a non-Foreach", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      cloudFlow({
        actions: [flowNode({ id: "If1", type: "If" }), flowNode({ id: "Loop", type: "Foreach", parentId: "If1" })],
      }),
    ];

    expect(pl012NestedForeach(doc)).toHaveLength(0);
  });
});
