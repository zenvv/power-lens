import { describe, expect, it } from "vitest";
import { MAX_ONSTART_LINES, pl005LongOnStart } from "../../src/rules/pl005-long-onstart.js";
import { canvasApp, emptyDocument, formula } from "./helpers.js";

describe("pl005LongOnStart", () => {
  it("flags an OnStart above the line threshold", () => {
    const doc = emptyDocument();
    const raw = "=" + Array.from({ length: MAX_ONSTART_LINES + 5 }, (_, i) => `Set(x${i}, ${i});`).join("\n");
    doc.artifacts = [canvasApp({ onStart: formula(raw) })];

    const diagnostics = pl005LongOnStart(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.path).toBe("App.OnStart");
  });

  it("does not flag a short OnStart", () => {
    const doc = emptyDocument();
    doc.artifacts = [canvasApp({ onStart: formula("=Set(x, 1)") })];

    expect(pl005LongOnStart(doc)).toHaveLength(0);
  });

  it("does not flag when there is no OnStart at all", () => {
    const doc = emptyDocument();
    doc.artifacts = [canvasApp({})];

    expect(pl005LongOnStart(doc)).toHaveLength(0);
  });
});
