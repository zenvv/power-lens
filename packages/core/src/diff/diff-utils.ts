/**
 * Diff estrutural entre dois `PowerLensDocument` (Fase 14 do plano de novas
 * features) — compara dois JSON já parseados, não texto bruto. `path` usa
 * notação tipo `screens.Screen1.root.children[Label3].properties.Text.raw`,
 * granular o bastante pra apontar exatamente o que mudou, genérica o
 * bastante pra uma única tree-diff view renderizar qualquer `entries[]`.
 */
export type DiffEntry = {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: unknown;
  after?: unknown;
};

/** Compara dois valores por identidade estrutural — suficiente pra
 * estruturas pequenas e "achatadas" (uma `Expression`, um `RunAfter[]`) onde
 * ordem de chave não varia entre duas execuções do mesmo parser sobre dois
 * arquivos. Não é um deep-equal de propósito geral. */
function shallowStructuralEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Compara dois valores primitivos (string, number, boolean, undefined). */
export function diffPrimitive(path: string, before: unknown, after: unknown, entries: DiffEntry[]): void {
  if (before === after) return;
  if (before === undefined) {
    entries.push({ path, kind: "added", after });
    return;
  }
  if (after === undefined) {
    entries.push({ path, kind: "removed", before });
    return;
  }
  entries.push({ path, kind: "changed", before, after });
}

/** Compara dois valores estruturados (objeto/array) como uma unidade —
 * "isso mudou", sem entrar campo a campo. Usado onde granularidade maior não
 * compensa (ex.: `FlowNode.inputs`, bruto e sem shape fixo). */
export function diffPlain(path: string, before: unknown, after: unknown, entries: DiffEntry[]): void {
  if (shallowStructuralEqual(before, after)) return;
  if (before === undefined) {
    entries.push({ path, kind: "added", after });
    return;
  }
  if (after === undefined) {
    entries.push({ path, kind: "removed", before });
    return;
  }
  entries.push({ path, kind: "changed", before, after });
}

/** Compara dois `Record<string, T>` chave a chave (ex.: `Control.properties`). */
export function diffRecord<T>(
  path: string,
  before: Record<string, T>,
  after: Record<string, T>,
  diffItem: (itemPath: string, before: T, after: T, entries: DiffEntry[]) => void,
  entries: DiffEntry[],
): void {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const itemPath = `${path}.${key}`;
    const beforeItem = before[key];
    const afterItem = after[key];
    if (beforeItem === undefined) {
      entries.push({ path: itemPath, kind: "added", after: afterItem });
      continue;
    }
    if (afterItem === undefined) {
      entries.push({ path: itemPath, kind: "removed", before: beforeItem });
      continue;
    }
    diffItem(itemPath, beforeItem, afterItem, entries);
  }
}

/** Compara dois arrays casando elementos por uma chave (nome, id, ou uma
 * composição de campos) — não por posição, já que ids gerados pelo parser
 * não são estáveis entre duas exportações independentes do "mesmo"
 * artefato (Screen/Control por nome, FlowNode por id, Relationship por
 * `from+to`). Elemento sem par vira `added`/`removed` sem entrar em
 * `diffItem`. */
export function diffKeyedArray<T>(
  path: string,
  before: readonly T[],
  after: readonly T[],
  keyOf: (item: T) => string,
  diffItem: (itemPath: string, before: T, after: T, entries: DiffEntry[]) => void,
  entries: DiffEntry[],
): void {
  const beforeMap = new Map(before.map((item) => [keyOf(item), item] as const));
  const afterMap = new Map(after.map((item) => [keyOf(item), item] as const));

  for (const [key, item] of afterMap) {
    const itemPath = `${path}[${key}]`;
    const beforeItem = beforeMap.get(key);
    if (!beforeItem) {
      entries.push({ path: itemPath, kind: "added", after: item });
      continue;
    }
    diffItem(itemPath, beforeItem, item, entries);
  }

  for (const [key, item] of beforeMap) {
    if (!afterMap.has(key)) entries.push({ path: `${path}[${key}]`, kind: "removed", before: item });
  }
}
