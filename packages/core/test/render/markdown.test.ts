import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../../src/render/index.js";
import { parseMsapp } from "../../src/parsers/msapp/index.js";
import { zipFixtureDir } from "../helpers/zip-fixture.js";

const FIXTURE_DIR = resolve(__dirname, "../../../../fixtures/synthetic/msapp-minimal");

function parseFixtureDoc() {
  const bytes = zipFixtureDir(FIXTURE_DIR);
  return parseMsapp(bytes, { fileName: "sample-app.msapp", fileSize: bytes.byteLength });
}

describe("renderMarkdown", () => {
  it("includes the source file name and format in the header", () => {
    const md = renderMarkdown(parseFixtureDoc());
    expect(md).toContain("# sample-app.msapp");
    expect(md).toContain(".msapp (Canvas App)");
  });

  it("renders the canvas app's screens, components and data sources", () => {
    const md = renderMarkdown(parseFixtureDoc());
    expect(md).toContain("## App Canvas: Sample App");
    expect(md).toContain("### Tela: Screen1");
    expect(md).toContain("### Componente: NavBar");
    expect(md).toContain("Pedidos");
  });

  it("renders the app-level OnStart when present", () => {
    const md = renderMarkdown(parseFixtureDoc());
    expect(md).toContain("### OnStart do app");
    expect(md).toContain("Set(glb");
  });

  it("renders the control tree with type annotations", () => {
    const md = renderMarkdown(parseFixtureDoc());
    expect(md).toContain("**HeaderContainer** _(GroupContainer)_");
    expect(md).toContain("**SubmitButton** _(Button)_");
    expect(md).toContain("**NavBar1** _(NavBar)_");
  });

  it("renders a diagnostics table when there are diagnostics", () => {
    const doc = parseFixtureDoc();
    doc.diagnostics.push({ code: "PL999", severity: "warning", message: "teste | com barra" });
    const md = renderMarkdown(doc);
    expect(md).toContain("## Diagnósticos");
    expect(md).toContain("PL999");
    expect(md).toContain("teste \\| com barra");
  });

  it("says there are no diagnostics when the list is empty", () => {
    const doc = parseFixtureDoc();
    doc.diagnostics = [];
    const md = renderMarkdown(doc);
    expect(md).toContain("Nenhum diagnóstico.");
  });

  it("is deterministic for the same document", () => {
    const doc = parseFixtureDoc();
    expect(renderMarkdown(doc)).toBe(renderMarkdown(doc));
  });
});
