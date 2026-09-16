import { describe, expect, it } from "vitest";
import { HEALTH_CHECK_RULES, RULE_REGISTRY, runHealthChecks } from "../../src/rules/index.js";
import { canvasApp, control, dataModel, emptyDocument, formula } from "./helpers.js";

describe("runHealthChecks", () => {
  it("runs every registered rule and concatenates their diagnostics", () => {
    expect(HEALTH_CHECK_RULES).toHaveLength(14);

    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [
          { name: "Screen1", order: 0, root: control({ name: "Screen1", type: "Screen" }) },
          { name: "Screen2", order: 1, root: control({ name: "Screen2", type: "Screen" }) },
        ],
      }),
      dataModel({
        relationships: [
          {
            from: { table: "Sales", column: "CustomerId" },
            to: { table: "Customers", column: "CustomerId" },
            cardinality: "manyToOne",
            crossFilter: "single",
            isActive: false,
          },
        ],
      }),
    ];

    const diagnostics = runHealthChecks(doc);
    expect(diagnostics.some((d) => d.code === "PL001")).toBe(true);
    expect(diagnostics.some((d) => d.code === "PL010")).toBe(true);
  });

  it("returns no diagnostics for a document with no artifacts", () => {
    expect(runHealthChecks(emptyDocument())).toHaveLength(0);
  });

  it("RULE_REGISTRY has one descriptor per registered rule, keyed by code", () => {
    expect(RULE_REGISTRY).toHaveLength(HEALTH_CHECK_RULES.length);
    expect(new Set(RULE_REGISTRY.map((d) => d.code)).size).toBe(RULE_REGISTRY.length);
  });

  it("skips a rule disabled via config", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      canvasApp({
        screens: [{ name: "Screen1", order: 0, root: control({ name: "Label1", type: "Label" }) }],
      }),
    ];

    expect(runHealthChecks(doc).some((d) => d.code === "PL002")).toBe(true);
    expect(runHealthChecks(doc, { PL002: { enabled: false } }).some((d) => d.code === "PL002")).toBe(false);
  });

  it("passes custom options through to the rule that declares them", () => {
    const doc = emptyDocument();
    doc.artifacts = [canvasApp({ onStart: formula("=Set(x, 1);\nSet(y, 2);\nSet(z, 3);") })];

    expect(runHealthChecks(doc).some((d) => d.code === "PL005")).toBe(false);
    const withCustomThreshold = runHealthChecks(doc, {
      PL005: { enabled: true, options: { maxLines: 2 } },
    });
    expect(withCustomThreshold.some((d) => d.code === "PL005")).toBe(true);
  });
});
