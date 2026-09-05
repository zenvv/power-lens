import { resolve } from "node:path";
import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { parseMsapp } from "../../src/parsers/msapp/index.js";
import { buildContextPack } from "../../src/render/index.js";
import { zipFixtureDir } from "../helpers/zip-fixture.js";

const FIXTURE_DIR = resolve(__dirname, "../../../../fixtures/synthetic/msapp-minimal");

function parseFixtureDoc() {
  const bytes = zipFixtureDir(FIXTURE_DIR);
  return parseMsapp(bytes, { fileName: "sample-app.msapp", fileSize: bytes.byteLength });
}

describe("buildContextPack", () => {
  it("produces a zip with the four expected files under power-lens-pack/", () => {
    const doc = parseFixtureDoc();
    const zipBytes = buildContextPack(doc);
    const entries = unzipSync(zipBytes);

    expect(Object.keys(entries).sort()).toEqual([
      "power-lens-pack/PROMPT.md",
      "power-lens-pack/README.txt",
      "power-lens-pack/ir.json",
      "power-lens-pack/summary.md",
    ]);
  });

  it("ir.json round-trips to the exact same document", () => {
    const doc = parseFixtureDoc();
    const zipBytes = buildContextPack(doc);
    const entries = unzipSync(zipBytes);
    const irJson = entries["power-lens-pack/ir.json"];
    expect(irJson).toBeDefined();

    const parsed = JSON.parse(new TextDecoder().decode(irJson));
    expect(parsed).toEqual(doc);
  });

  it("summary.md matches renderMarkdown output", () => {
    const doc = parseFixtureDoc();
    const zipBytes = buildContextPack(doc);
    const entries = unzipSync(zipBytes);
    const summaryMd = entries["power-lens-pack/summary.md"];
    expect(summaryMd).toBeDefined();
    expect(new TextDecoder().decode(summaryMd)).toContain("# sample-app.msapp");
  });

  it("PROMPT.md and README.txt mention the source file name", () => {
    const doc = parseFixtureDoc();
    const zipBytes = buildContextPack(doc);
    const entries = unzipSync(zipBytes);
    const promptMd = entries["power-lens-pack/PROMPT.md"];
    const readme = entries["power-lens-pack/README.txt"];
    expect(promptMd).toBeDefined();
    expect(readme).toBeDefined();
    expect(new TextDecoder().decode(promptMd)).toContain("sample-app.msapp");
    expect(new TextDecoder().decode(readme)).toContain("sample-app.msapp");
  });
});
