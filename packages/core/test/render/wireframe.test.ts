import { describe, expect, it } from "vitest";
import {
  evalConstantArithmetic,
  resolveControlLayout,
  resolveScreenLayout,
  DEFAULT_CANVAS_WIDTH,
} from "../../src/render/wireframe/index.js";
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

describe("resolveControlLayout — Parent.Width/Height", () => {
  it("substitutes Parent.Width when a layout context is given", () => {
    const root = control({
      name: "HeaderContainer",
      type: "GroupContainer",
      variant: "AutoLayout",
      properties: { Width: { raw: "=Parent.Width", kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root, { parentWidth: 1366 }).width).toEqual({ status: "resolved", value: 1366 });
  });

  it("still handles Parent.Width combined with arithmetic", () => {
    const root = control({
      name: "Box1",
      type: "GroupContainer",
      properties: { Width: { raw: "=Parent.Width - 40", kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root, { parentWidth: 1366 }).width).toEqual({ status: "resolved", value: 1326 });
  });

  it("propagates a resolved width down to children as their own Parent.Width", () => {
    const child = control({
      name: "Inner",
      type: "GroupContainer",
      properties: { Width: { raw: "=Parent.Width", kind: "formula", references: [] } },
    });
    const root = control({
      name: "Outer",
      type: "GroupContainer",
      properties: { Width: { raw: "=600", kind: "literal", literal: 600, references: [] } },
      children: [child],
    });

    expect(resolveControlLayout(root).children[0]?.width).toEqual({ status: "resolved", value: 600 });
  });

  it("does not guess a child's Parent.Width when the parent's own width didn't resolve", () => {
    const child = control({
      name: "Inner",
      type: "GroupContainer",
      properties: { Width: { raw: "=Parent.Width", kind: "formula", references: [] } },
    });
    const root = control({
      name: "Outer",
      type: "GroupContainer",
      properties: { Width: { raw: "=Parent.Width", kind: "formula", references: [] } },
      children: [child],
    });

    expect(resolveControlLayout(root).children[0]?.width.status).toBe("dynamic");
  });

  it("resolveScreenLayout seeds the default canvas size as the root's Parent context", () => {
    const root = control({
      name: "Screen1",
      type: "Screen",
      children: [
        control({
          name: "HeaderContainer",
          type: "GroupContainer",
          variant: "AutoLayout",
          properties: { Width: { raw: "=Parent.Width", kind: "formula", references: [] } },
        }),
      ],
    });

    const resolved = resolveScreenLayout({ name: "Screen1", order: 0, root });
    expect(resolved.children[0]?.width).toEqual({ status: "resolved", value: DEFAULT_CANVAS_WIDTH });
  });
});

describe("resolveControlLayout — style properties", () => {
  it("resolves BorderColor/BorderThickness like Fill/Width", () => {
    const root = control({
      name: "Box1",
      type: "GroupContainer",
      properties: {
        BorderColor: { raw: "=RGBA(0, 0, 0, 1)", kind: "formula", references: [] },
        BorderThickness: { raw: "=2", kind: "literal", literal: 2, references: [] },
      },
    });

    const resolved = resolveControlLayout(root);
    expect(resolved.borderColor).toEqual({ status: "resolved", value: "rgba(0, 0, 0, 1)" });
    expect(resolved.borderThickness).toEqual({ status: "resolved", value: 2 });
  });

  it("resolves an enum-member BorderStyle (e.g. =BorderStyle.None)", () => {
    const root = control({
      name: "Box1",
      type: "GroupContainer",
      properties: { BorderStyle: { raw: "=BorderStyle.None", kind: "formula", references: [] } },
    });

    expect(resolveControlLayout(root).borderStyle).toEqual({ status: "resolved", value: "None" });
  });

  it("defaults Visible to true and Bold to false when absent", () => {
    const resolved = resolveControlLayout(control({ name: "Label1", type: "Label" }));
    expect(resolved.visible).toEqual({ status: "resolved", value: true });
    expect(resolved.bold).toEqual({ status: "resolved", value: false });
  });

  it("resolves Visible: false as a literal", () => {
    const root = control({
      name: "Label1",
      type: "Label",
      properties: { Visible: { raw: "=false", kind: "literal", literal: false, references: [] } },
    });

    expect(resolveControlLayout(root).visible).toEqual({ status: "resolved", value: false });
  });
});

describe("resolveControlLayout — AutoLayout", () => {
  it("only populates `layout` when variant is AutoLayout", () => {
    expect(resolveControlLayout(control({ name: "Box1", type: "GroupContainer" })).layout).toBeUndefined();
  });

  it("resolves LayoutDirection/LayoutGap/padding for an AutoLayout container", () => {
    const root = control({
      name: "HeaderContainer",
      type: "GroupContainer",
      variant: "AutoLayout",
      properties: {
        LayoutDirection: { raw: "=LayoutDirection.Horizontal", kind: "formula", references: [] },
        LayoutGap: { raw: "=8", kind: "literal", literal: 8, references: [] },
        PaddingTop: { raw: "=12", kind: "literal", literal: 12, references: [] },
      },
    });

    const layout = resolveControlLayout(root).layout;
    expect(layout?.direction).toEqual({ status: "resolved", value: "Horizontal" });
    expect(layout?.gap).toEqual({ status: "resolved", value: 8 });
    expect(layout?.paddingTop).toEqual({ status: "resolved", value: 12 });
  });
});
