import { resolve } from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { validateDocument } from "../../src/ir/index.js";
import { parseMsapp } from "../../src/parsers/msapp/index.js";
import { zipFixtureDir } from "../helpers/zip-fixture.js";

const FIXTURE_DIR = resolve(__dirname, "../../../../fixtures/synthetic/msapp-minimal");

function parseFixture() {
  const bytes = zipFixtureDir(FIXTURE_DIR);
  return parseMsapp(bytes, { fileName: "sample-app.msapp", fileSize: bytes.byteLength });
}

describe("parseMsapp — Studio export package wrapper", () => {
  it("unwraps the outer Microsoft.PowerApps export package to find the real .msapp", () => {
    const innerMsappBytes = zipFixtureDir(FIXTURE_DIR);
    const outerBytes = zipSync({
      "manifest.json": new TextEncoder().encode("{}"),
      "Microsoft.PowerApps/apps/12345/12345.json": new TextEncoder().encode("{}"),
      "Microsoft.PowerApps/apps/12345/Nabc-document.msapp": innerMsappBytes,
      "Microsoft.Flow/flows/manifest.json": new TextEncoder().encode("{}"),
      "Microsoft.Flow/flows/def-guid/definition.json": new TextEncoder().encode("{}"),
    });

    const doc = parseMsapp(outerBytes, { fileName: "Export_20260101.zip", fileSize: outerBytes.byteLength });

    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    expect(app?.kind).toBe("canvasApp");
    if (app?.kind === "canvasApp") {
      expect(app.screens[0]?.name).toBe("Screen1");
    }

    expect(doc.diagnostics.some((d) => d.code === "PL109")).toBe(true);
    expect(doc.diagnostics.some((d) => d.code === "PL112")).toBe(true);
    expect(validateDocument(doc).ok).toBe(true);
  });

  it("reports an error when multiple .msapp entries make the package ambiguous", () => {
    const innerMsappBytes = zipFixtureDir(FIXTURE_DIR);
    const outerBytes = zipSync({
      "Microsoft.PowerApps/apps/1/a.msapp": innerMsappBytes,
      "Microsoft.PowerApps/apps/2/b.msapp": innerMsappBytes,
    });

    const doc = parseMsapp(outerBytes, { fileName: "Weird.zip", fileSize: outerBytes.byteLength });
    expect(doc.diagnostics.some((d) => d.code === "PL110")).toBe(true);
  });
});

describe("parseMsapp — screens", () => {
  it("finds exactly one screen with the expected name", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    expect(app?.kind).toBe("canvasApp");
    if (app?.kind !== "canvasApp") return;

    expect(app.screens).toHaveLength(1);
    expect(app.screens[0]?.name).toBe("Screen1");
    expect(app.screens[0]?.order).toBe(0);
  });

  it("finds the component defined in Src/Components/", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    expect(app.components).toHaveLength(1);
    expect(app.components[0]?.name).toBe("NavBar");
  });
});

describe("parseMsapp — control tree", () => {
  it("builds a nested tree preserving document order, and strips control version suffixes", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    const root = app.screens[0]?.root;
    expect(root?.type).toBe("Screen");
    expect(root?.children.map((c) => c.name)).toEqual(["HeaderContainer", "NavBar1"]);

    const header = root?.children[0];
    expect(header?.type).toBe("GroupContainer");
    expect(header?.children.map((c) => c.name)).toEqual(["Title1", "SubmitButton"]);
    expect(header?.children[0]?.type).toBe("Label");
    expect(header?.children[1]?.type).toBe("Button");
  });

  it("resolves a CanvasComponent instance's type to its ComponentName, not the generic marker", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    const navBarInstance = app.screens[0]?.root.children.find((c) => c.name === "NavBar1");
    expect(navBarInstance?.type).toBe("NavBar");
  });
});

describe("parseMsapp — properties as Expression", () => {
  it("classifies quoted strings and numbers as literals", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    const title = app.screens[0]?.root.children[0]?.children[0];
    const text = title?.properties.Text;
    expect(text?.kind).toBe("literal");
    expect(text?.literal).toBe("Bem-vindo");
  });

  it("classifies non-literal formulas as kind formula", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    const header = app.screens[0]?.root.children[0];
    expect(header?.properties.Width?.kind).toBe("formula");
    expect(header?.properties.Width?.raw).toBe("=Parent.Width");
  });

  it("handles the bare '=' empty-formula gotcha without throwing", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    const header = app.screens[0]?.root.children[0];
    expect(header?.properties.PaddingTop?.raw).toBe("=");
  });
});

describe("parseMsapp — references", () => {
  it("extracts function, dataSource, control, screen and variable references from one formula", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    const button = app.screens[0]?.root.children[0]?.children[1];
    const onSelect = button?.properties.OnSelect;
    expect(onSelect?.kind).toBe("formula");

    const refs = onSelect?.references ?? [];
    expect(refs).toContainEqual({ kind: "function", name: "Patch" });
    expect(refs).toContainEqual({ kind: "function", name: "Defaults" });
    expect(refs).toContainEqual({ kind: "function", name: "Set" });
    expect(refs).toContainEqual({ kind: "function", name: "Navigate" });
    expect(refs).toContainEqual({ kind: "dataSource", name: "Pedidos" });
    expect(refs).toContainEqual({ kind: "control", name: "Title1" });
    expect(refs).toContainEqual({ kind: "screen", name: "Screen1" });
  });

  it("does not classify an ambiguous property access like .Text", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    const button = app.screens[0]?.root.children[0]?.children[1];
    const refs = button?.properties.OnSelect?.references ?? [];
    expect(refs.some((r) => r.name === "Text")).toBe(false);
  });

  it("infers a variable usage from Set(varEnviado, ...)", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    expect(app.variables).toContainEqual({ name: "varEnviado", kind: "variable" });
  });
});

describe("parseMsapp — data sources", () => {
  it("keeps real connected data sources and drops flow references and static sample data", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    expect(app.dataSources).toEqual([{ name: "Pedidos", type: "ConnectedDataSourceInfo" }]);
  });
});

describe("parseMsapp — app metadata", () => {
  it("reads id/name from Properties.json", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    expect(app.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(app.name).toBe("Sample App");
  });

  it("extracts the app-level OnStart from Src/App.pa.yaml, including its references", () => {
    const doc = parseFixture();
    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    if (app?.kind !== "canvasApp") throw new Error("expected canvasApp artifact");

    expect(app.onStart?.kind).toBe("formula");
    expect(app.onStart?.raw).toContain("Set(glb");

    // Set(glb, ...) in App.pa.yaml's OnStart should register "glb" as a
    // variable usage, the same way a Set() inside a control's formula would.
    expect(app.variables).toContainEqual({ name: "glb", kind: "variable" });
    expect(app.onStart?.references).toContainEqual({ kind: "function", name: "Set" });
    expect(app.onStart?.references).toContainEqual({ kind: "variable", name: "glb" });
  });
});

describe("parseMsapp — output validity", () => {
  it("produces a document that passes the IR schema", () => {
    const doc = parseFixture();
    const result = validateDocument(doc);
    expect(result.ok).toBe(true);
  });

  it("never throws on a byte stream that isn't a zip at all", () => {
    const doc = parseMsapp(new TextEncoder().encode("not a zip"), {
      fileName: "broken.msapp",
      fileSize: 9,
    });
    expect(doc.diagnostics.some((d) => d.severity === "error")).toBe(true);
    expect(validateDocument(doc).ok).toBe(true);
  });
});
