import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { validateDocument } from "../../src/ir/index.js";
import { parseSolution } from "../../src/parsers/solution/index.js";
import { zipFixtureDir } from "../helpers/zip-fixture.js";

const SOLUTION_XML_PATH = resolve(__dirname, "../../../../fixtures/synthetic/solution-minimal/solution.xml");
const MSAPP_FIXTURE_DIR = resolve(__dirname, "../../../../fixtures/synthetic/msapp-minimal");

function buildSolutionZip(options?: { includeApp?: boolean; includeWorkflow?: boolean; includeCustomizations?: boolean }) {
  const files: Record<string, Uint8Array> = {
    "solution.xml": readFileSync(SOLUTION_XML_PATH),
  };

  if (options?.includeApp !== false) {
    files["CanvasApps/SampleApp.msapp"] = zipFixtureDir(MSAPP_FIXTURE_DIR);
  }
  if (options?.includeWorkflow) {
    files["Workflows/SomeFlow-1.json"] = new TextEncoder().encode("{}");
  }
  if (options?.includeCustomizations) {
    files["customizations.xml"] = new TextEncoder().encode("<ImportExportXml/>");
  }

  return zipSync(files);
}

describe("parseSolution — metadata", () => {
  it("extracts solution name, version and publisher from solution.xml", () => {
    const bytes = buildSolutionZip();
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    const meta = doc.artifacts.find((a) => a.kind === "solutionMeta");
    expect(meta?.kind).toBe("solutionMeta");
    if (meta?.kind !== "solutionMeta") return;

    expect(meta.name).toBe("Sample Solution");
    expect(meta.version).toBe("1.0.0.0");
    expect(meta.publisher).toBe("Sample Publisher");
  });

  it("warns but does not throw when solution.xml is missing", () => {
    const bytes = zipSync({ "readme.txt": new TextEncoder().encode("nothing here") });
    const doc = parseSolution(bytes, { fileName: "empty.zip", fileSize: bytes.byteLength });

    expect(doc.artifacts.some((a) => a.kind === "solutionMeta")).toBe(false);
    expect(doc.diagnostics.some((d) => d.code === "PL304")).toBe(true);
  });
});

describe("parseSolution — embedded canvas apps", () => {
  it("parses CanvasApps/*.msapp via the msapp parser and includes it as an artifact", () => {
    const bytes = buildSolutionZip();
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    const app = doc.artifacts.find((a) => a.kind === "canvasApp");
    expect(app?.kind).toBe("canvasApp");
    if (app?.kind !== "canvasApp") return;
    expect(app.screens).toHaveLength(1);
    expect(app.screens[0]?.name).toBe("Screen1");
  });

  it("prefixes diagnostics from the embedded app with its path inside the solution", () => {
    const files: Record<string, Uint8Array> = {
      "solution.xml": readFileSync(SOLUTION_XML_PATH),
      "CanvasApps/Broken.msapp": new TextEncoder().encode("not a zip"),
    };
    const bytes = zipSync(files);
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    const embeddedDiagnostic = doc.diagnostics.find((d) => d.code === "PL100");
    expect(embeddedDiagnostic?.path).toBe("CanvasApps/Broken.msapp");
  });
});

describe("parseSolution — out-of-phase content", () => {
  it("notes Workflows/*.json presence without attempting to parse it", () => {
    const bytes = buildSolutionZip({ includeWorkflow: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    expect(doc.diagnostics.some((d) => d.code === "PL305")).toBe(true);
  });

  it("notes customizations.xml presence without attempting to parse it", () => {
    const bytes = buildSolutionZip({ includeCustomizations: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    expect(doc.diagnostics.some((d) => d.code === "PL306")).toBe(true);
  });
});

describe("parseSolution — output validity", () => {
  it("produces a document that passes the IR schema", () => {
    const bytes = buildSolutionZip({ includeWorkflow: true, includeCustomizations: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });
    expect(validateDocument(doc).ok).toBe(true);
  });

  it("never throws on a byte stream that isn't a zip at all", () => {
    const doc = parseSolution(new TextEncoder().encode("not a zip"), {
      fileName: "broken.zip",
      fileSize: 9,
    });
    expect(doc.diagnostics.some((d) => d.severity === "error")).toBe(true);
    expect(validateDocument(doc).ok).toBe(true);
  });
});
