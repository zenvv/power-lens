import { describe, expect, it } from "vitest";
import { pl014RiskyRelationshipShape } from "../../src/rules/pl014-risky-relationship-shape.js";
import { dataModel, emptyDocument } from "./helpers.js";

describe("pl014RiskyRelationshipShape", () => {
  it("flags a bidirectional cross-filter relationship", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        relationships: [
          {
            from: { table: "Sales", column: "RegionId" },
            to: { table: "Regions", column: "RegionId" },
            cardinality: "manyToOne",
            crossFilter: "both",
            isActive: true,
          },
        ],
      }),
    ];

    const diagnostics = pl014RiskyRelationshipShape(doc, { locale: "pt" });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("bidirecional");
  });

  it("flags a many-to-many relationship", () => {
    const doc = emptyDocument();
    doc.artifacts = [
      dataModel({
        relationships: [
          {
            from: { table: "Products", column: "CategoryId" },
            to: { table: "Categories", column: "CategoryId" },
            cardinality: "manyToMany",
            crossFilter: "single",
            isActive: true,
          },
        ],
      }),
    ];

    const diagnostics = pl014RiskyRelationshipShape(doc, { locale: "pt" });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("muitos-para-muitos");
  });

  it("does not flag a single-direction many-to-one relationship", () => {
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

    expect(pl014RiskyRelationshipShape(doc)).toHaveLength(0);
  });
});
