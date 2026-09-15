import { describe, expect, it } from "vitest";
import { HEALTH_CHECK_RULES, runHealthChecks } from "../../src/rules/index.js";
import { canvasApp, control, dataModel, emptyDocument } from "./helpers.js";

describe("runHealthChecks", () => {
  it("runs every registered rule and concatenates their diagnostics", () => {
    expect(HEALTH_CHECK_RULES).toHaveLength(10);

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
});
