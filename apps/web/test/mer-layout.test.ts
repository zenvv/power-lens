import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipSync } from "fflate";
import { parsePbit } from "@power-lens/core";
import { describe, expect, it } from "vitest";
import { layoutModel } from "../src/lib/mer-layout.js";

const SCHEMA_PATH = resolve(__dirname, "../../../fixtures/synthetic/pbit-minimal/DataModelSchema.json");

function encodeUtf16LE(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes[i * 2] = code & 0xff;
    bytes[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return bytes;
}

function loadModel() {
  const schemaText = readFileSync(SCHEMA_PATH, "utf-8");
  const bytes = zipSync({ DataModelSchema: encodeUtf16LE(schemaText) });
  const doc = parsePbit(bytes, { fileName: "Sample.pbit", fileSize: bytes.byteLength });
  const model = doc.artifacts.find((a) => a.kind === "dataModel");
  if (model?.kind !== "dataModel") throw new Error("expected dataModel artifact");
  return model;
}

describe("layoutModel", () => {
  it("produces one node per table, all with computed positions", async () => {
    const model = loadModel();
    const { nodes } = await layoutModel(model, new Set(model.tables.map((t) => t.name)));

    expect(nodes).toHaveLength(model.tables.length);
    for (const node of nodes) {
      expect(Number.isNaN(node.position.x)).toBe(false);
      expect(Number.isNaN(node.position.y)).toBe(false);
    }
  });

  it("gives an expanded table a taller node than a collapsed one", async () => {
    const model = loadModel();
    const { nodes: expandedNodes } = await layoutModel(model, new Set(["Sales"]));
    const { nodes: collapsedNodes } = await layoutModel(model, new Set());

    const expandedHeight = Number(expandedNodes.find((n) => n.id === "Sales")?.style?.height);
    const collapsedHeight = Number(collapsedNodes.find((n) => n.id === "Sales")?.style?.height);
    expect(expandedHeight).toBeGreaterThan(collapsedHeight);
  });

  it("orients every edge from the '1' side to the '*' side, regardless of raw from/to", async () => {
    const model = loadModel();
    const { edges } = await layoutModel(model, new Set());

    // rel-default: Sales(many) -> Customers(one) no TMSL; a aresta deve
    // fluir Customers -> Sales (1 -> *), não Sales -> Customers.
    const defaultRel = edges.find((e) => e.label === "1 : *" && e.source === "Customers");
    expect(defaultRel?.target).toBe("Sales");

    // rel-one-to-many-both-inactive: Customers(one) -> Sales(many) já no
    // TMSL, direção não deveria ser invertida.
    expect(edges.filter((e) => e.source === "Customers" && e.target === "Sales")).toHaveLength(2);
  });

  it("marks an inactive relationship's edge with a dashed style", async () => {
    const model = loadModel();
    const { edges } = await layoutModel(model, new Set());

    const inactive = edges.find((e) => e.style?.strokeDasharray !== undefined);
    expect(inactive).toBeDefined();
    expect(inactive?.markerStart).toBeDefined();
  });
});
