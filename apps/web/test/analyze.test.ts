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

  it("flags a detected-but-unimplemented format instead of throwing", async () => {
    const file = new File(
      [new TextEncoder().encode(JSON.stringify({ definition: { triggers: {}, actions: {} } }))],
      "definition.json",
    );
    const result = await analyzeFile(file);
    expect(result.status).toBe("parsed");
    if (result.status !== "parsed") return;
    expect(result.document.source.detectedFormat).toBe("flow");
    expect(result.document.diagnostics.some((d) => d.code === "PL210")).toBe(true);
  });
});
