import type { Control, Expression, Screen } from "../../ir/index.js";

/**
 * Resolução de X/Y/Width/Height/Text/Fill pro wireframe (spec seção 7):
 * "Resolve quando são literais ou aritmética constante; tudo o mais vira
 * placeholder marcado como dinâmico." `absent` existe separado de `dynamic`
 * porque "a propriedade nem foi setada" e "a propriedade tem uma fórmula que
 * não conseguimos resolver" pedem tratamentos visuais diferentes no
 * renderer (a primeira não é nem um pouco surpreendente).
 */
export type Resolved<T> =
  | { status: "resolved"; value: T }
  | { status: "dynamic"; raw: string }
  | { status: "absent" };

// ── Avaliador de aritmética constante (só números, + - * / e parênteses) ──
// Deliberadamente não é um parser de Power Fx: qualquer identificador,
// função (fora o caso especial de RGBA abaixo) ou string vira "dynamic".

type Token = { kind: "num"; value: number } | { kind: "op"; value: "+" | "-" | "*" | "/" } | { kind: "lparen" } | { kind: "rparen" };

function tokenize(expr: string): Token[] | undefined {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i]!;
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      tokens.push({ kind: "op", value: c });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j]!)) j++;
      const numText = expr.slice(i, j);
      const value = Number(numText);
      if (Number.isNaN(value)) return undefined;
      tokens.push({ kind: "num", value });
      i = j;
      continue;
    }
    return undefined; // qualquer outro caractere (identificador, string, "&"...) não é aritmética pura
  }
  return tokens;
}

/** Gramática por precedência: expr := term (('+'|'-') term)*, term := unary (('*'|'/') unary)*,
 * unary := '-'? atom, atom := num | '(' expr ')'. */
function parseExpression(tokens: Token[]): number | undefined {
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  /** Devolve o operador no topo se for um dos passados, já narrowed — evita
   * checar `peek()?.kind`/`peek()?.value` em chamadas separadas (TS não
   * consegue correlacionar duas chamadas de `peek()` pra narrowing). */
  function peekOp(...ops: readonly ("+" | "-" | "*" | "/")[]): ("+" | "-" | "*" | "/") | undefined {
    const token = peek();
    return token?.kind === "op" && (ops as string[]).includes(token.value) ? token.value : undefined;
  }

  function parseAtom(): number | undefined {
    const token = peek();
    if (!token) return undefined;
    if (token.kind === "num") {
      pos++;
      return token.value;
    }
    if (token.kind === "lparen") {
      pos++;
      const value = parseAddSub();
      if (value === undefined) return undefined;
      if (peek()?.kind !== "rparen") return undefined;
      pos++;
      return value;
    }
    return undefined;
  }

  function parseUnary(): number | undefined {
    if (peekOp("-")) {
      pos++;
      const value = parseUnary();
      return value === undefined ? undefined : -value;
    }
    return parseAtom();
  }

  function parseMulDiv(): number | undefined {
    let left = parseUnary();
    if (left === undefined) return undefined;
    let op: "+" | "-" | "*" | "/" | undefined;
    while ((op = peekOp("*", "/"))) {
      pos++;
      const right = parseUnary();
      if (right === undefined) return undefined;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseAddSub(): number | undefined {
    let left = parseMulDiv();
    if (left === undefined) return undefined;
    let op: "+" | "-" | "*" | "/" | undefined;
    while ((op = peekOp("+", "-"))) {
      pos++;
      const right = parseMulDiv();
      if (right === undefined) return undefined;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const result = parseAddSub();
  if (result === undefined || pos !== tokens.length) return undefined;
  return result;
}

/** Avalia uma expressão de aritmética constante (ex.: "40 + 20", "(800-40)/2").
 * Retorna `undefined` pra qualquer coisa fora desse subconjunto — identificador,
 * chamada de função, string, etc. */
export function evalConstantArithmetic(raw: string): number | undefined {
  const tokens = tokenize(raw);
  if (!tokens || tokens.length === 0) return undefined;
  return parseExpression(tokens);
}

// ── RGBA(...) com argumentos de aritmética constante ──────────────────────

function splitTopLevelArgs(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

/**
 * `Fill`/`Color` são quase sempre `=RGBA(r, g, b, a)` no Studio, mesmo pra
 * cores fixas — sem tratar isso como "aritmética constante" (os 4
 * argumentos são), o wireframe nunca conseguiria mostrar nenhuma cor real.
 */
function tryResolveRgba(body: string): string | undefined {
  const match = /^RGBA\(([\s\S]*)\)$/i.exec(body.trim());
  if (!match) return undefined;
  const args = splitTopLevelArgs(match[1]!);
  if (args.length !== 4) return undefined;

  const values = args.map((arg) => evalConstantArithmetic(arg.trim()));
  if (values.some((v) => v === undefined)) return undefined;
  const [r, g, b, a] = values as number[];
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ── Resolução por propriedade ──────────────────────────────────────────────

function resolveNumeric(expr: Expression | undefined): Resolved<number> {
  if (!expr) return { status: "absent" };
  if (expr.kind === "literal") {
    return typeof expr.literal === "number"
      ? { status: "resolved", value: expr.literal }
      : { status: "dynamic", raw: expr.raw };
  }
  const value = evalConstantArithmetic(expr.raw.slice(1));
  return value === undefined ? { status: "dynamic", raw: expr.raw } : { status: "resolved", value };
}

function resolveText(expr: Expression | undefined): Resolved<string> {
  if (!expr) return { status: "absent" };
  if (expr.kind === "literal" && expr.literal !== undefined) {
    return { status: "resolved", value: String(expr.literal) };
  }
  return { status: "dynamic", raw: expr.raw };
}

function resolveColor(expr: Expression | undefined): Resolved<string> {
  if (!expr) return { status: "absent" };
  if (expr.kind === "formula") {
    const css = tryResolveRgba(expr.raw.slice(1));
    if (css) return { status: "resolved", value: css };
  }
  return { status: "dynamic", raw: expr.raw };
}

// ── Árvore de layout resolvida ─────────────────────────────────────────────

export type ResolvedControl = {
  name: string;
  type: string;
  x: Resolved<number>;
  y: Resolved<number>;
  width: Resolved<number>;
  height: Resolved<number>;
  text: Resolved<string>;
  fill: Resolved<string>;
  children: ResolvedControl[];
};

export function resolveControlLayout(control: Control): ResolvedControl {
  return {
    name: control.name,
    type: control.type,
    x: resolveNumeric(control.properties["X"]),
    y: resolveNumeric(control.properties["Y"]),
    width: resolveNumeric(control.properties["Width"]),
    height: resolveNumeric(control.properties["Height"]),
    text: resolveText(control.properties["Text"]),
    fill: resolveColor(control.properties["Fill"]),
    children: control.children.map(resolveControlLayout),
  };
}

export function resolveScreenLayout(screen: Screen): ResolvedControl {
  return resolveControlLayout(screen.root);
}
