import { describe, expect, it } from "vitest";
import { pl010InactiveRelationship } from "../../src/rules/pl010-inactive-relationship.js";
import { dataModel, emptyDocument } from "./helpers.js";

describe("pl010InactiveRelationship", () => {
  it("flags an inactive relationship", () => {
    const doc = emptyDocument();
    doc.artifacts = [
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

    const diagnostics = pl010InactiveRelationship(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("Sales.CustomerId");
  });

  it("does not flag an active relationship", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
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

    expect(pl010InactiveRelationship(doc)).toHaveLength(0);
  });
});
