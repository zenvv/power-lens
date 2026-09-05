import { describe, expect, it } from "vitest";
import {
  createEmptyDocument,
  validateDocument,
  type PowerLensDocument,
} from "../src/ir/index.js";

function minimalValidDocument(): PowerLensDocument {
  const doc = createEmptyDocument({
    fileName: "app.msapp",
    fileSize: 1024,
    detectedFormat: "msapp",
  });

  doc.artifacts.push({
    kind: "canvasApp",
    id: "app-1",
    name: "Sample App",
    screens: [
      {
        name: "Screen1",
        order: 0,
        root: {
          name: "Screen1",
          type: "Screen",
          properties: {
            Fill: {
              raw: "=RGBA(255, 255, 255, 1)",
              kind: "formula",
              references: [],
            },
          },
          children: [
            {
              name: "Label1",
              type: "Label",
              properties: {
                Text: { raw: '="Hello"', kind: "literal", literal: "Hello", references: [] },
              },
              children: [],
            },
          ],
        },
      },
    ],
    components: [],
    dataSources: [],
    variables: [],
  });

  return doc;
}

describe("PowerLensDocument schema", () => {
  it("accepts a minimal valid document", () => {
    const result = validateDocument(minimalValidDocument());
    expect(result.ok).toBe(true);
  });

  it("accepts a document with zero artifacts", () => {
    const result = validateDocument(createEmptyDocument({
      fileName: "empty.msapp",
      fileSize: 0,
      detectedFormat: "msapp",
    }));
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid document with a useful message", () => {
    const invalid = {
      schemaVersion: "0.1",
      source: {
        fileName: "app.msapp",
        // fileSize missing entirely
        detectedFormat: "not-a-real-format",
        parsedAt: "not-a-date",
        parserVersion: "0.1.0",
      },
      artifacts: [],
      diagnostics: [],
    };

    const result = validateDocument(invalid);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.message.length).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.path === "source.fileSize")).toBe(true);
    expect(result.issues.some((issue) => issue.path === "source.detectedFormat")).toBe(true);
  });

  it("rejects a wrong schemaVersion", () => {
    const doc = minimalValidDocument();
    const result = validateDocument({ ...doc, schemaVersion: "0.2" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((issue) => issue.path === "schemaVersion")).toBe(true);
  });

  it("round-trips through JSON without losing validity or data", () => {
    const original = minimalValidDocument();
    const roundTripped = JSON.parse(JSON.stringify(original));

    const result = validateDocument(roundTripped);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.document).toEqual(original);
  });
});
