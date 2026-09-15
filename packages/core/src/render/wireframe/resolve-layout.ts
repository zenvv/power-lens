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

/**
 * Tamanho de tela assumido quando não há como saber o real (nada no IR hoje
 * carrega Width/Height do app — `Src/App.pa.yaml` nunca foi inspecionado
 * pra isso, ver docs/FORMAT-NOTES.md). 1366×768 é o formato "tablet"
 * (paisagem) mais comum do Power Apps Studio. Decisão explícita do usuário:
 * viewport fixo por enquanto, em vez de tentar parsear o tamanho real.
 */
export const DEFAULT_CANVAS_WIDTH = 1366;
export const DEFAULT_CANVAS_HEIGHT = 768;

/** Tamanho resolvido do pai mais próximo, usado só pra substituir
 * `Parent.Width`/`Parent.Height` antes de avaliar aritmética constante —
 * não é um mecanismo geral de resolução de identificador (`Self.X`,
 * `ThisItem...` etc. continuam virando "dynamic", de propósito). */
export type LayoutContext = { parentWidth?: number; parentHeight?: number };

function substituteParentSize(raw: string, context: LayoutContext): string {
  let result = raw;
  if (context.parentWidth !== undefined) result = result.replace(/\bParent\.Width\b/g, String(context.parentWidth));
  if (context.parentHeight !== undefined) result = result.replace(/\bParent\.Height\b/g, String(context.parentHeight));
  return result;
}

function resolveNumeric(expr: Expression | undefined, context: LayoutContext = {}): Resolved<number> {
  if (!expr) return { status: "absent" };
  if (expr.kind === "literal") {
    return typeof expr.literal === "number"
      ? { status: "resolved", value: expr.literal }
      : { status: "dynamic", raw: expr.raw };
  }
  const value = evalConstantArithmetic(substituteParentSize(expr.raw.slice(1), context));
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

function resolveBoolean(expr: Expression | undefined, defaultWhenAbsent: boolean): Resolved<boolean> {
  if (!expr) return { status: "resolved", value: defaultWhenAbsent };
  if (expr.kind === "literal" && typeof expr.literal === "boolean") {
    return { status: "resolved", value: expr.literal };
  }
  return { status: "dynamic", raw: expr.raw };
}

/**
 * `BorderStyle`, `LayoutDirection` e as demais propriedades de layout do
 * AutoLayout são referências a membro de enum do Power Fx (ex.
 * `=BorderStyle.None`, confirmado em docs/FORMAT-NOTES.md seção 1.4) — uma
 * `Expression` de `kind: "formula"`, não um literal, então precisa do mesmo
 * tratamento especial que `tryResolveRgba` dá pra `Fill`.
 */
function resolveEnumMember(expr: Expression | undefined, enumName: string): Resolved<string> {
  if (!expr) return { status: "absent" };
  if (expr.kind === "literal" && typeof expr.literal === "string") {
    return { status: "resolved", value: expr.literal };
  }
  if (expr.kind === "formula") {
    const match = new RegExp(`^${enumName}\\.([A-Za-z0-9_]+)$`).exec(expr.raw.slice(1).trim());
    if (match) return { status: "resolved", value: match[1]! };
  }
  return { status: "dynamic", raw: expr.raw };
}

// ── Árvore de layout resolvida ─────────────────────────────────────────────

/** Só populado quando `variant === "AutoLayout"` — as demais telas/controles
 * usam posicionamento livre (X/Y), onde essas propriedades não existem. */
export type ResolvedAutoLayout = {
  direction: Resolved<string>;
  gap: Resolved<number>;
  align: Resolved<string>;
  justify: Resolved<string>;
  paddingTop: Resolved<number>;
  paddingRight: Resolved<number>;
  paddingBottom: Resolved<number>;
  paddingLeft: Resolved<number>;
};

export type ResolvedControl = {
  name: string;
  type: string;
  variant?: string;
  x: Resolved<number>;
  y: Resolved<number>;
  width: Resolved<number>;
  height: Resolved<number>;
  text: Resolved<string>;
  fill: Resolved<string>;
  color: Resolved<string>;
  fontSize: Resolved<number>;
  bold: Resolved<boolean>;
  borderColor: Resolved<string>;
  borderThickness: Resolved<number>;
  borderStyle: Resolved<string>;
  visible: Resolved<boolean>;
  layout?: ResolvedAutoLayout;
  children: ResolvedControl[];
};

export function resolveControlLayout(control: Control, context: LayoutContext = {}): ResolvedControl {
  const width = resolveNumeric(control.properties["Width"], context);
  const height = resolveNumeric(control.properties["Height"], context);
  const isAutoLayout = control.variant === "AutoLayout";

  // Propaga Width/Height pros filhos como o Parent.Width/Height deles: valor
  // resolvido usa ele mesmo; "absent" (a maioria dos containers/telas nunca
  // declara Width — o tamanho vem de fora) herda o Parent.Width ambiente,
  // já que não é um caso de fórmula que falhou, é simplesmente não ter
  // fórmula nenhuma; só "dynamic" (uma fórmula que existe mas não dá pra
  // resolver) não propaga nada — não dá pra saber, então os filhos que
  // dependem dela também viram "dynamic" em vez de herdar um número
  // adivinhado (degradação honesta em vez de propagar um valor errado).
  const childParentWidth = width.status === "resolved" ? width.value : width.status === "absent" ? context.parentWidth : undefined;
  const childParentHeight =
    height.status === "resolved" ? height.value : height.status === "absent" ? context.parentHeight : undefined;
  const childContext: LayoutContext = {
    ...(childParentWidth !== undefined ? { parentWidth: childParentWidth } : {}),
    ...(childParentHeight !== undefined ? { parentHeight: childParentHeight } : {}),
  };

  return {
    name: control.name,
    type: control.type,
    ...(control.variant ? { variant: control.variant } : {}),
    x: resolveNumeric(control.properties["X"], context),
    y: resolveNumeric(control.properties["Y"], context),
    width,
    height,
    text: resolveText(control.properties["Text"]),
    fill: resolveColor(control.properties["Fill"]),
    color: resolveColor(control.properties["Color"]),
    fontSize: resolveNumeric(control.properties["Size"], context),
    bold: resolveBoolean(control.properties["Bold"], false),
    borderColor: resolveColor(control.properties["BorderColor"]),
    borderThickness: resolveNumeric(control.properties["BorderThickness"], context),
    borderStyle: resolveEnumMember(control.properties["BorderStyle"], "BorderStyle"),
    visible: resolveBoolean(control.properties["Visible"], true),
    ...(isAutoLayout
      ? {
          layout: {
            direction: resolveEnumMember(control.properties["LayoutDirection"], "LayoutDirection"),
            gap: resolveNumeric(control.properties["LayoutGap"], context),
            align: resolveEnumMember(control.properties["LayoutAlignItems"], "LayoutAlignItems"),
            justify: resolveEnumMember(control.properties["LayoutJustifyContent"], "LayoutJustifyContent"),
            paddingTop: resolveNumeric(control.properties["PaddingTop"], context),
            paddingRight: resolveNumeric(control.properties["PaddingRight"], context),
            paddingBottom: resolveNumeric(control.properties["PaddingBottom"], context),
            paddingLeft: resolveNumeric(control.properties["PaddingLeft"], context),
          },
        }
      : {}),
    children: control.children.map((child) => resolveControlLayout(child, childContext)),
  };
}

/**
 * Semeia o contexto com o viewport padrão (`DEFAULT_CANVAS_WIDTH/HEIGHT`) —
 * é o que faz `Width: =Parent.Width`, o padrão em praticamente todo
 * container real (docs/FORMAT-NOTES.md seção 1.4), resolver pra um número de
 * verdade em vez de cair em "dynamic" já no primeiro nível da árvore.
 */
export function resolveScreenLayout(screen: Screen): ResolvedControl {
  return resolveControlLayout(screen.root, { parentWidth: DEFAULT_CANVAS_WIDTH, parentHeight: DEFAULT_CANVAS_HEIGHT });
}
