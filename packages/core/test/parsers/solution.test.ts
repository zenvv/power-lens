import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { validateDocument } from "../../src/ir/index.js";
import { parseSolution } from "../../src/parsers/solution/index.js";
import { zipFixtureDir } from "../helpers/zip-fixture.js";

const SOLUTION_XML_PATH = resolve(__dirname, "../../../../fixtures/synthetic/solution-minimal/solution.xml");
const CUSTOMIZATIONS_XML_PATH = resolve(
  __dirname,
  "../../../../fixtures/synthetic/solution-minimal/customizations.xml",
);
const MSAPP_FIXTURE_DIR = resolve(__dirname, "../../../../fixtures/synthetic/msapp-minimal");
const FLOW_FIXTURE_PATH = resolve(__dirname, "../../../../fixtures/synthetic/flow-minimal/definition.json");

function buildSolutionZip(options?: {
  includeApp?: boolean;
  includeWorkflow?: boolean;
  includeCustomizations?: boolean | "empty";
}) {
  const files: Record<string, Uint8Array> = {
    "solution.xml": readFileSync(SOLUTION_XML_PATH),
  };

  if (options?.includeApp !== false) {
    files["CanvasApps/SampleApp.msapp"] = zipFixtureDir(MSAPP_FIXTURE_DIR);
  }
  if (options?.includeWorkflow) {
    files["Workflows/SomeFlow-1.json"] = readFileSync(FLOW_FIXTURE_PATH);
  }
  if (options?.includeCustomizations === "empty") {
    files["customizations.xml"] = new TextEncoder().encode("<ImportExportXml/>");
  } else if (options?.includeCustomizations) {
    files["customizations.xml"] = readFileSync(CUSTOMIZATIONS_XML_PATH);
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

describe("parseSolution — embedded flows", () => {
  it("parses Workflows/*.json via the flow parser and includes it as an artifact", () => {
    const bytes = buildSolutionZip({ includeWorkflow: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    const flow = doc.artifacts.find((a) => a.kind === "cloudFlow");
    expect(flow?.kind).toBe("cloudFlow");
    if (flow?.kind === "cloudFlow") {
      expect(flow.trigger.name).toBe("When_an_item_is_created");
      expect(flow.actions).toHaveLength(6);
    }
  });
});

describe("parseSolution — Dataverse tables (customizations.xml)", () => {
  it("extracts tables, columns and relationships from customizations.xml", () => {
    const bytes = buildSolutionZip({ includeCustomizations: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    expect(model?.kind).toBe("dataModel");
    if (model?.kind !== "dataModel") return;

    expect(model.tables.map((t) => t.name)).toEqual(["new_pedido", "new_fornecedor", "new_categoria"]);

    const pedido = model.tables[0]!;
    expect(pedido.columns.map((c) => c.name)).toEqual([
      "new_pedidoid",
      "new_titulo",
      "new_fornecedorid",
      "new_valortotalcalculado",
    ]);
    expect(pedido.columns.find((c) => c.name === "new_titulo")?.dataType).toBe("nvarchar");
  });

  it("marks a column with CalculationOf/FormulaDefinitionFileName as calculated", () => {
    const bytes = buildSolutionZip({ includeCustomizations: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    const calculated = model.tables[0]!.columns.find((c) => c.name === "new_valortotalcalculado");
    expect(calculated?.isCalculated).toBe(true);
    const regular = model.tables[0]!.columns.find((c) => c.name === "new_titulo");
    expect(regular?.isCalculated).toBe(false);
  });

  it("maps a OneToMany EntityRelationship to a manyToOne relationship, PK inferred as <entity>id", () => {
    const bytes = buildSolutionZip({ includeCustomizations: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    const rel = model.relationships.find((r) => r.from.table === "new_pedido" && r.to.table === "new_fornecedor");
    expect(rel).toEqual({
      from: { table: "new_pedido", column: "new_fornecedorid" },
      to: { table: "new_fornecedor", column: "new_fornecedorid" },
      cardinality: "manyToOne",
      crossFilter: "single",
      isActive: true,
    });
  });

  it("maps a ManyToMany EntityRelationship using FirstEntityName/SecondEntityName", () => {
    const bytes = buildSolutionZip({ includeCustomizations: true });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    const rel = model.relationships.find((r) => r.cardinality === "manyToMany");
    expect(rel?.from).toEqual({ table: "new_pedido", column: "new_pedidoid" });
    expect(rel?.to).toEqual({ table: "new_categoria", column: "new_categoriaid" });
  });

  it("notes customizations.xml presence but reports no table when Entities is empty", () => {
    const bytes = buildSolutionZip({ includeCustomizations: "empty" });
    const doc = parseSolution(bytes, { fileName: "SampleSolution.zip", fileSize: bytes.byteLength });

    expect(doc.artifacts.some((a) => a.kind === "dataModel")).toBe(false);
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
