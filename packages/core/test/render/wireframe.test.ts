import { describe, expect, it } from "vitest";
import { evalConstantArithmetic, resolveControlLayout } from "../../src/render/wireframe/index.js";
import type { Control } from "../../src/ir/index.js";

describe("evalConstantArithmetic", () => {
  it.each([
    ["40", 40],
    ["40 + 20", 60],
    ["(800 - 40) / 2", 380],
    ["-10 + 5", -5],
    ["2 * 3 + 4", 10],
    ["2 * (3 + 4)", 14],
  ])("resolves %s to %d", (raw, expected) => {
    expect(evalConstantArithmetic(raw)).toBe(expected);
  });

  it.each(["Parent.Width", '"hello"', "Parent.Width - 40", "RGBA(0,0,0,1)", "1 +", ""])(
    "returns undefined for %s",
    (raw) => {
      expect(evalConstantArithmetic(raw)).toBeUndefined();
    },
  );
});

function control(overrides: Partial<Control> & Pick<Control, "name" | "type">): Control {
  return { properties: {}, children: [], ...overrides };
}

describe("resolveControlLayout", () => {
  it("resolves a literal-kind numeric property (the common case after msapp parsing)", () => {
    const root = control({
      name: "Icon1",
      type: "Icon",
      properties: {
        X: { raw: "=0", kind: "literal", literal: 0, references: [] },
        Y: { raw: "=0", kind: "literal", literal: 0, references: [] },
      },
    });

    const resolved = resolveControlLayout(root);
    expect(resolved.x).toEqual({ status: "resolved", value: 0 });
    expect(resolved.y).toEqual({ status: "resolved", value: 0 });
  });

  it("resolves a formula-kind property that is pure constant arithmetic", () => {
    const root = control({
      name: "Label1",
      type: "Label",
      properties: { Width: { raw: "=800 - 40", kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root).width).toEqual({ status: "resolved", value: 760 });
  });

  it("marks a property referencing another control/Parent as dynamic", () => {
    const root = control({
      name: "HeaderContainer",
      type: "GroupContainer",
      properties: { Width: { raw: "=Parent.Width", kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root).width).toEqual({ status: "dynamic", raw: "=Parent.Width" });
  });

  it("marks an absent property as absent, not dynamic", () => {
    const root = control({ name: "Label1", type: "Label" });
    expect(resolveControlLayout(root).height).toEqual({ status: "absent" });
  });

  it("resolves Text from a literal string", () => {
    const root = control({
      name: "Title1",
      type: "Label",
      properties: { Text: { raw: '="Bem-vindo"', kind: "literal", literal: "Bem-vindo", references: [] } },
    });

    expect(resolveControlLayout(root).text).toEqual({ status: "resolved", value: "Bem-vindo" });
  });

  it("marks a formula-kind Text (e.g. concatenation) as dynamic", () => {
    const root = control({
      name: "Title1",
      type: "Label",
      properties: { Text: { raw: '=ThisItem.Name & "!"', kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root).text.status).toBe("dynamic");
  });

  it("resolves Fill from RGBA(...) with constant-arithmetic arguments", () => {
    const root = control({
      name: "Screen1",
      type: "Screen",
      properties: { Fill: { raw: "=RGBA(255, 255, 255, 1)", kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root).fill).toEqual({ status: "resolved", value: "rgba(255, 255, 255, 1)" });
  });

  it("marks Fill as dynamic when RGBA args reference something non-constant", () => {
    const root = control({
      name: "Screen1",
      type: "Screen",
      properties: { Fill: { raw: "=RGBA(Parent.Fill.Red, 0, 0, 1)", kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root).fill.status).toBe("dynamic");
  });

  it("recurses into children", () => {
    const root = control({
      name: "Screen1",
      type: "Screen",
      children: [control({ name: "Label1", type: "Label" }), control({ name: "Label2", type: "Label" })],
    });

    const resolved = resolveControlLayout(root);
    expect(resolved.children.map((c) => c.name)).toEqual(["Label1", "Label2"]);
  });
});
