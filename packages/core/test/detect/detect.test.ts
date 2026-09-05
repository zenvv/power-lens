import { resolve } from "node:path";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { detectFormat } from "../../src/detect/index.js";
import { zipFixtureDir } from "../helpers/zip-fixture.js";

const MSAPP_FIXTURE_DIR = resolve(__dirname, "../../../../fixtures/synthetic/msapp-minimal");

describe("detectFormat", () => {
  it("detects a real .msapp fixture by its internal Src/*.pa.yaml structure", () => {
    const bytes = zipFixtureDir(MSAPP_FIXTURE_DIR);
    const result = detectFormat(bytes, "app.msapp");
    expect(result.format).toBe("msapp");
  });

  it("detects a solution zip by the presence of solution.xml", () => {
    const bytes = zipSync({
      "solution.xml": new TextEncoder().encode("<ImportExportXml><SolutionManifest/></ImportExportXml>"),
      "[Content_Types].xml": new TextEncoder().encode("<Types/>"),
    });
    const result = detectFormat(bytes, "MySolution_1_0_0_0.zip");
    expect(result.format).toBe("solution");
  });

  it("detects a bare flow definition.json by its top-level keys", () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ definition: { triggers: {}, actions: {} } }),
    );
    const result = detectFormat(bytes, "definition.json");
    expect(result.format).toBe("flow");
  });

  it("returns undefined with a diagnostic for a file that is neither zip nor recognizable JSON", () => {
    const bytes = new TextEncoder().encode("this is just plain text, not a package");
    const result = detectFormat(bytes, "mystery.bin");
    expect(result.format).toBeUndefined();
    expect(result.diagnostics.some((d) => d.severity === "error")).toBe(true);
  });

  it("returns undefined with a diagnostic for a zip with no known internal signature", () => {
    const bytes = zipSync({ "readme.txt": new TextEncoder().encode("hello") });
    const result = detectFormat(bytes, "archive.zip");
    expect(result.format).toBeUndefined();
  });

  it("flags .pbip as needing the whole project folder, not just the pointer file", () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ version: "1.0" }));
    const result = detectFormat(bytes, "MyReport.pbip");
    expect(result.format).toBe("pbip");
    expect(result.diagnostics.some((d) => d.severity === "warning")).toBe(true);
  });
});
