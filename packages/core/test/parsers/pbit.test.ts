import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { validateDocument } from "../../src/ir/index.js";
import { parsePbit } from "../../src/parsers/powerbi/index.js";

const SCHEMA_PATH = resolve(__dirname, "../../../../fixtures/synthetic/pbit-minimal/DataModelSchema.json");
const REPORT_LAYOUT_PATH = resolve(__dirname, "../../../../fixtures/synthetic/pbit-minimal/ReportLayout.json");

/**
 * A real .pbit stores DataModelSchema as UTF-16LE without a BOM
 * (docs/FORMAT-NOTES.md seção 6) — the fixture on disk stays UTF-8/plain
 * text for diffability, and the test re-encodes it here to faithfully
 * reproduce what the parser actually receives.
 */
function encodeUtf16LE(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes[i * 2] = code & 0xff;
    bytes[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return bytes;
}

function buildPbitZip(schemaText?: string, options?: { includeReportLayout?: boolean }) {
  const text = schemaText ?? readFileSync(SCHEMA_PATH, "utf-8");
  const files: Record<string, Uint8Array> = { DataModelSchema: encodeUtf16LE(text) };
  if (options?.includeReportLayout) {
    files["Report/Layout"] = encodeUtf16LE(readFileSync(REPORT_LAYOUT_PATH, "utf-8"));
  }
  return zipSync(files);
}

describe("parsePbit — tables e colunas", () => {
  it("extrai tabelas, colunas e a expressão M da partição como sourceExpression", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });

    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    expect(model?.kind).toBe("dataModel");
    if (model?.kind !== "dataModel") return;

    expect(model.tables.map((t) => t.name)).toEqual(["Customers", "Sales", "LocalDateTable_hidden"]);

    const customers = model.tables[0]!;
    expect(customers.columns).toHaveLength(2);
    expect(customers.sourceExpression).toContain("Sql.Database");
  });

  it("marca coluna calculada e captura sua expressão (string única)", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    const sales = model.tables.find((t) => t.name === "Sales")!;
    const calculated = sales.columns.find((c) => c.name === "AmountRounded")!;
    expect(calculated.isCalculated).toBe(true);
    expect(calculated.expression).toBe("ROUND([Amount], 0)");

    const regular = sales.columns.find((c) => c.name === "Amount")!;
    expect(regular.isCalculated).toBe(false);
    expect(regular.expression).toBeUndefined();
  });

  it("marca tabela oculta via isHidden", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    expect(model.tables.find((t) => t.name === "LocalDateTable_hidden")?.isHidden).toBe(true);
    expect(model.tables.find((t) => t.name === "Customers")?.isHidden).toBeUndefined();
  });
});

describe("parsePbit — medidas", () => {
  it("junta um expression em array (uma linha por item) com quebras de linha", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    expect(model.measures).toHaveLength(1);
    const measure = model.measures[0]!;
    expect(measure.name).toBe("Total Amount");
    expect(measure.table).toBe("Sales");
    expect(measure.formatString).toBe("0.00");
    expect(measure.expression).toBe("\nSUM(\n    Sales[Amount]\n)");
  });
});

describe("parsePbit — relacionamentos", () => {
  it("assume muitos-para-um, filtro single e ativo quando os campos vêm omitidos", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    const rel = model.relationships.find((r) => r.from.table === "Sales")!;
    expect(rel.cardinality).toBe("manyToOne");
    expect(rel.crossFilter).toBe("single");
    expect(rel.isActive).toBe(true);
  });

  it("respeita cardinalidade, crossFilteringBehavior e isActive quando explícitos", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    const model = doc.artifacts.find((a) => a.kind === "dataModel");
    if (model?.kind !== "dataModel") throw new Error("expected dataModel");

    const rel = model.relationships.find((r) => r.from.table === "Customers")!;
    expect(rel.cardinality).toBe("oneToMany");
    expect(rel.crossFilter).toBe("both");
    expect(rel.isActive).toBe(false);
  });
});

describe("parsePbit — Report/Layout", () => {
  it("does not produce a report artifact when Report/Layout is absent", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });

    expect(doc.artifacts.some((a) => a.kind === "report")).toBe(false);
  });

  it("extracts pages ordered by ordinal, skipping group containers", () => {
    const bytes = buildPbitZip(undefined, { includeReportLayout: true });
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });

    const report = doc.artifacts.find((a) => a.kind === "report");
    expect(report?.kind).toBe("report");
    if (report?.kind !== "report") return;

    expect(report.pages.map((p) => p.name)).toEqual(["Visão geral", "Detalhe"]);
    expect(report.pages[0]?.visuals).toHaveLength(1);
  });

  it("extracts visual type, title and field names", () => {
    const bytes = buildPbitZip(undefined, { includeReportLayout: true });
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    const report = doc.artifacts.find((a) => a.kind === "report");
    if (report?.kind !== "report") throw new Error("expected report");

    const visual = report.pages[0]!.visuals[0]!;
    expect(visual.type).toBe("columnChart");
    expect(visual.title).toBe("Vendas por cliente");
    expect(visual.fields).toEqual(["Sales.Amount", "Customers.Name"]);
  });

  it("extracts a visual with no title as undefined, not a placeholder string", () => {
    const bytes = buildPbitZip(undefined, { includeReportLayout: true });
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    const report = doc.artifacts.find((a) => a.kind === "report");
    if (report?.kind !== "report") throw new Error("expected report");

    const visual = report.pages[1]!.visuals[0]!;
    expect(visual.type).toBe("card");
    expect(visual.title).toBeUndefined();
  });

  it("produces a document that passes the IR schema with a report artifact present", () => {
    const bytes = buildPbitZip(undefined, { includeReportLayout: true });
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    expect(validateDocument(doc).ok).toBe(true);
  });
});

describe("parsePbit — degradação honesta", () => {
  it("nunca lança em um byte stream que não é zip", () => {
    const doc = parsePbit(new TextEncoder().encode("not a zip"), { fileName: "broken.pbit", fileSize: 9 });
    expect(doc.diagnostics.some((d) => d.code === "PL500")).toBe(true);
    expect(validateDocument(doc).ok).toBe(true);
  });

  it("avisa quando DataModelSchema não existe no zip", () => {
    const bytes = zipSync({ "readme.txt": new TextEncoder().encode("nada aqui") });
    const doc = parsePbit(bytes, { fileName: "empty.pbit", fileSize: bytes.byteLength });
    expect(doc.diagnostics.some((d) => d.code === "PL501")).toBe(true);
    expect(doc.artifacts).toHaveLength(0);
  });

  it("avisa quando DataModelSchema não é um JSON válido", () => {
    const bytes = zipSync({ DataModelSchema: encodeUtf16LE("{ not json") });
    const doc = parsePbit(bytes, { fileName: "broken.pbit", fileSize: bytes.byteLength });
    expect(doc.diagnostics.some((d) => d.code === "PL502")).toBe(true);
  });

  it("produz um documento que passa no schema do IR", () => {
    const bytes = buildPbitZip();
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
    expect(validateDocument(doc).ok).toBe(true);
  });

  it("avisa mas mantém o DataModel quando Report/Layout não é um JSON válido", () => {
    const bytes = zipSync({
      DataModelSchema: encodeUtf16LE(readFileSync(SCHEMA_PATH, "utf-8")),
      "Report/Layout": encodeUtf16LE("{ not json"),
    });
    const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });

    expect(doc.diagnostics.some((d) => d.code === "PL506")).toBe(true);
    expect(doc.artifacts.some((a) => a.kind === "dataModel")).toBe(true);
    expect(doc.artifacts.some((a) => a.kind === "report")).toBe(false);
  });
});
