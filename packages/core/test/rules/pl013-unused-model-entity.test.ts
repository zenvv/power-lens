import { describe, expect, it } from "vitest";
import { pl013UnusedModelEntity } from "../../src/rules/pl013-unused-model-entity.js";
import { dataModel, emptyDocument } from "./helpers.js";

describe("pl013UnusedModelEntity", () => {
  it("flags a table with no relationship and no formula referencing it", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        tables: [{ name: "Staging", columns: [{ name: "Id", dataType: "int64", isCalculated: false }] }],
      }),
    ];

    const diagnostics = pl013UnusedModelEntity(doc);
    expect(diagnostics.filter((d) => d.severity === "warning")).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("Staging");
  });

  it("does not flag a table used in a relationship", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        tables: [
          { name: "Sales", columns: [{ name: "CustomerId", dataType: "int64", isCalculated: false }] },
          { name: "Customers", columns: [{ name: "CustomerId", dataType: "int64", isCalculated: false }] },
        ],
        relationships: [
          {
            from: { table: "Sales", column: "CustomerId" },
            to: { table: "Customers", column: "CustomerId" },
            cardinality: "manyToOne",
            crossFilter: "single",
            isActive: true,
          },
        ],
      }),
    ];

    expect(pl013UnusedModelEntity(doc).filter((d) => d.severity === "warning")).toHaveLength(0);
  });

  it("does not flag a table referenced only in a measure expression", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        tables: [{ name: "Sales", columns: [{ name: "Amount", dataType: "decimal", isCalculated: false }] }],
        measures: [{ name: "Total", table: "Sales", expression: "SUM(Sales[Amount])" }],
      }),
    ];

    expect(pl013UnusedModelEntity(doc)).toHaveLength(0);
  });

  it("flags a column with no relationship and no formula referencing it", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        tables: [
          {
            name: "Sales",
            columns: [
              { name: "Amount", dataType: "decimal", isCalculated: false },
              { name: "Notes", dataType: "string", isCalculated: false },
            ],
          },
        ],
        measures: [{ name: "Total", table: "Sales", expression: "SUM(Sales[Amount])" }],
      }),
    ];

    const diagnostics = pl013UnusedModelEntity(doc).filter((d) => d.severity === "info");
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("Sales.Notes");
  });

  it("does not flag a column name that is a substring of another table's name", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        tables: [
          { name: "Order", columns: [{ name: "Id", dataType: "int64", isCalculated: false }] },
          { name: "Orders", columns: [{ name: "Id", dataType: "int64", isCalculated: false }] },
        ],
        measures: [{ name: "Total", table: "Orders", expression: "COUNTROWS(Orders)" }],
      }),
    ];

    const tableDiagnostics = pl013UnusedModelEntity(doc).filter((d) => d.severity === "warning");
    expect(tableDiagnostics.some((d) => d.message.includes('"Order"'))).toBe(true);
    expect(tableDiagnostics.some((d) => d.message.includes('"Orders"'))).toBe(false);
  });
});
