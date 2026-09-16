import { describe, expect, it } from "vitest";
import { buildLineageIndex } from "../../src/analysis/build-lineage-index.js";
import { dataModel } from "../rules/helpers.js";
import type { Report } from "../../src/ir/index.js";

function report(overrides: Partial<Report> = {}): Report {
  return { kind: "report", id: "report-1", name: "Relatório", pages: [], ...overrides };
}

describe("buildLineageIndex", () => {
  it("returns every column and measure with an empty visuals list when there is no report", () => {
    const model = dataModel({
      tables: [{ name: "Sales", columns: [{ name: "Amount", dataType: "decimal", isCalculated: false }] }],
      measures: [{ name: "Total", table: "Sales", expression: "SUM(Sales[Amount])" }],
    });

    const entries = buildLineageIndex(model, undefined);
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.visuals.length === 0)).toBe(true);
  });

  it("links a column to a visual referencing it directly", () => {
    const model = dataModel({
      tables: [{ name: "Sales", columns: [{ name: "Amount", dataType: "decimal", isCalculated: false }] }],
    });
    const rep = report({
      pages: [{ name: "Página 1", order: 0, visuals: [{ type: "card", fields: ["Sales.Amount"] }] }],
    });

    const entries = buildLineageIndex(model, rep);
    const amount = entries.find((e) => e.name === "Amount")!;
    expect(amount.visuals).toEqual([{ pageName: "Página 1", visualType: "card" }]);
  });

  it("links a column to a visual referencing it through an aggregation wrapper", () => {
    const model = dataModel({
      tables: [{ name: "Sales", columns: [{ name: "Amount", dataType: "decimal", isCalculated: false }] }],
    });
    const rep = report({
      pages: [{ name: "Página 1", order: 0, visuals: [{ type: "columnChart", fields: ["Min(Sales.Amount)"] }] }],
    });

    const entries = buildLineageIndex(model, rep);
    expect(entries.find((e) => e.name === "Amount")!.visuals).toHaveLength(1);
  });

  it("links a measure to a visual and includes the visual title", () => {
    const model = dataModel({
      tables: [{ name: "Sales", columns: [] }],
      measures: [{ name: "Total", table: "Sales", expression: "SUM(Sales[Amount])" }],
    });
    const rep = report({
      pages: [{ name: "Página 1", order: 0, visuals: [{ type: "card", title: "Total geral", fields: ["Sales.Total"] }] }],
    });

    const entries = buildLineageIndex(model, rep);
    const total = entries.find((e) => e.kind === "measure")!;
    expect(total.visuals).toEqual([{ pageName: "Página 1", visualType: "card", visualTitle: "Total geral" }]);
  });

  it("leaves a column unused when no visual field matches it", () => {
    const model = dataModel({
      tables: [{ name: "Sales", columns: [{ name: "Amount", dataType: "decimal", isCalculated: false }] }],
    });
    const rep = report({
      pages: [{ name: "Página 1", order: 0, visuals: [{ type: "card", fields: ["Sales.OutraColuna"] }] }],
    });

    const entries = buildLineageIndex(model, rep);
    expect(entries.find((e) => e.name === "Amount")!.visuals).toHaveLength(0);
  });

  it("ignores a field with no table qualifier", () => {
    const model = dataModel({
      tables: [{ name: "Sales", columns: [{ name: "Amount", dataType: "decimal", isCalculated: false }] }],
    });
    const rep = report({ pages: [{ name: "Página 1", order: 0, visuals: [{ type: "card", fields: ["Amount"] }] }] });

    expect(() => buildLineageIndex(model, rep)).not.toThrow();
    expect(buildLineageIndex(model, rep).find((e) => e.name === "Amount")!.visuals).toHaveLength(0);
  });
});
