/**
 * Turns a Workflow Definition Language `If.expression` into a readable
 * one-line string for the DAG viewer. `expression` is either a bare
 * expression string (`"@equals(...)"`, kept as-is minus the `@`) or an
 * operator tree (`{"and": [{"equals": [a, b]}]}`, the shape the classic
 * Power Automate designer emits) — see raw-shapes.ts for the [LACUNA] note,
 * this is unverified against a real definition.json. Only the comparison and
 * boolean operators documented at
 * https://learn.microsoft.com/azure/logic-apps/workflow-definition-language-functions-reference
 * get a symbol; anything else degrades honestly to `operator(args...)`
 * instead of guessing a meaning.
 */

const COMPARISON_SYMBOLS: Readonly<Record<string, string>> = {
  equals: "==",
  strongEquals: "===",
  greater: ">",
  greaterOrEquals: ">=",
  less: "<",
  lessOrEquals: "<=",
};

/** Strips the `@` prefix WDL uses to mark a string as an expression, so the
 * UI doesn't show it twice (once as prefix, once implied by context). Also
 * used directly on `Foreach.foreach`, which is always a plain expression
 * string rather than an operator tree. */
export function cleanExpressionString(expr: string): string {
  return expr.startsWith("@") ? expr.slice(1) : expr;
}

function stringifyOperand(value: unknown): string {
  if (typeof value === "string") return cleanExpressionString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(stringifyOperand).join(", ")}]`;
  if (value && typeof value === "object") return stringifyCondition(value);
  return JSON.stringify(value);
}

function formatOperator(operator: string, args: unknown): string {
  if (operator === "not") {
    const inner = Array.isArray(args) ? args[0] : args;
    return `not (${stringifyCondition(inner)})`;
  }

  if ((operator === "and" || operator === "or") && Array.isArray(args)) {
    if (args.length === 1) return stringifyCondition(args[0]);
    const joiner = operator === "and" ? " and " : " or ";
    return args.map((arg) => `(${stringifyCondition(arg)})`).join(joiner);
  }

  const symbol = COMPARISON_SYMBOLS[operator];
  if (symbol && Array.isArray(args) && args.length === 2) {
    return `${stringifyOperand(args[0])} ${symbol} ${stringifyOperand(args[1])}`;
  }

  const argList = Array.isArray(args) ? args.map(stringifyOperand).join(", ") : stringifyOperand(args);
  return `${operator}(${argList})`;
}

export function stringifyCondition(expression: unknown): string {
  if (typeof expression === "string") return cleanExpressionString(expression);
  if (!expression || typeof expression !== "object" || Array.isArray(expression)) {
    return JSON.stringify(expression) ?? "";
  }

  const entries = Object.entries(expression as Record<string, unknown>);
  if (entries.length === 0) return "";
  if (entries.length > 1) {
    return entries.map(([operator, args]) => formatOperator(operator, args)).join(" and ");
  }

  const [operator, args] = entries[0]!;
  return formatOperator(operator, args);
}
