import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { zipSync, type Zippable } from "fflate";
import { describe, expect, it } from "vitest";
import { analyzeFile } from "../src/lib/analyze.js";

const FIXTURE_DIR = resolve(__dirname, "../../../fixtures/synthetic/msapp-minimal");

function zipFixtureDir(dirPath: string): Uint8Array {
  const entries: Zippable = {};
  function walk(current: string) {
    for (const name of readdirSync(current)) {
      const fullPath = join(current, name);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }
      entries[relative(dirPath, fullPath).split(sep).join("/")] = readFileSync(fullPath);
    }
  }
  walk(dirPath);
  return zipSync(entries);
}

describe("analyzeFile", () => {
  it("detects and parses a real .msapp File end to end", async () => {
    const bytes = zipFixtureDir(FIXTURE_DIR);
    const file = new File([bytes], "sample-app.msapp", { type: "application/octet-stream" });

    const result = await analyzeFile(file);

    expect(result.status).toBe("parsed");
    if (result.status !== "parsed") return;
    expect(result.document.source.detectedFormat).toBe("msapp");
    const app = result.document.artifacts.find((a) => a.kind === "canvasApp");
    expect(app?.kind).toBe("canvasApp");
    if (app?.kind === "canvasApp") {
      expect(app.screens[0]?.name).toBe("Screen1");
    }
  });

  it("returns an unrecognized result for garbage input", async () => {
    const file = new File([new TextEncoder().encode("not a package")], "mystery.bin");
    const result = await analyzeFile(file);
    expect(result.status).toBe("unrecognized");
  });

  it("detects and parses a flow definition.json end to end", async () => {
    const flowBytes = readFileSync(resolve(__dirname, "../../../fixtures/synthetic/flow-minimal/definition.json"));
    const file = new File([flowBytes], "definition.json", { type: "application/json" });

    const result = await analyzeFile(file);

    expect(result.status).toBe("parsed");
    if (result.status !== "parsed") return;
    expect(result.document.source.detectedFormat).toBe("flow");
    const flow = result.document.artifacts.find((a) => a.kind === "cloudFlow");
    expect(flow?.kind).toBe("cloudFlow");
    if (flow?.kind === "cloudFlow") {
      expect(flow.trigger.name).toBe("When_an_item_is_created");
    }
  });

  it("flags a detected-but-unimplemented format instead of throwing", async () => {
    // A zip with no recognizable internal signature falls back to the file
    // extension (detectFormat's PL203 path) rather than to "undefined".
    const zipBytes = zipSync({ "readme.txt": new TextEncoder().encode("hello") });
    const file = new File([zipBytes], "report.pbit", { type: "application/octet-stream" });
    const result = await analyzeFile(file);
    expect(result.status).toBe("parsed");
    if (result.status !== "parsed") return;
    expect(result.document.source.detectedFormat).toBe("pbit");
    expect(result.document.diagnostics.some((d) => d.code === "PL210")).toBe(true);
  });
});
