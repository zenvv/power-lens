import { describe, expect, it } from "vitest";
import { stringifyCondition } from "../../src/parsers/flow/condition.js";

describe("stringifyCondition", () => {
  it("renders a bare expression string, stripping the @ prefix", () => {
    expect(stringifyCondition("@equals(triggers().code, 'InternalServerError')")).toBe(
      "equals(triggers().code, 'InternalServerError')",
    );
  });

  it("renders a single comparison operator with its symbol", () => {
    expect(stringifyCondition({ equals: ["@variables('status')", "Approved"] })).toBe(
      "variables('status') == Approved",
    );
    expect(stringifyCondition({ greater: ["@triggerBody()?['Total']", 1000] })).toBe(
      "triggerBody()?['Total'] > 1000",
    );
  });

  it("unwraps a single-item and/or instead of adding useless parens", () => {
    expect(stringifyCondition({ and: [{ greater: ["@variables('n')", 0] }] })).toBe("variables('n') > 0");
  });

  it("joins a multi-item and/or with parens around each operand", () => {
    expect(
      stringifyCondition({
        and: [{ equals: ["@variables('status')", "Approved"] }, { greater: ["@variables('amount')", 1000] }],
      }),
    ).toBe("(variables('status') == Approved) and (variables('amount') > 1000)");

    expect(
      stringifyCondition({ or: [{ equals: ["@triggers().code", 200] }, { equals: ["@triggers().code", 201] }] }),
    ).toBe("(triggers().code == 200) or (triggers().code == 201)");
  });

  it("renders not as a prefix around its inner expression", () => {
    expect(stringifyCondition({ not: [{ equals: ["@variables('x')", true] }] })).toBe(
      "not (variables('x') == true)",
    );
  });

  it("degrades an unrecognized operator to function-call syntax instead of guessing", () => {
    expect(stringifyCondition({ contains: ["@variables('name')", "foo"] })).toBe(
      "contains(variables('name'), foo)",
    );
  });

  it("nests and/or trees, adding parens at each level", () => {
    expect(
      stringifyCondition({
        or: [
          { and: [{ equals: ["@variables('a')", 1] }, { equals: ["@variables('b')", 2] }] },
          { equals: ["@variables('c')", 3] },
        ],
      }),
    ).toBe("((variables('a') == 1) and (variables('b') == 2)) or (variables('c') == 3)");
  });
});
