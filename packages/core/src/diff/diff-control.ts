import type { Control } from "../ir/index.js";
import { diffKeyedArray, diffPrimitive, diffRecord, type DiffEntry } from "./diff-utils.js";

/** Compara dois `Control` da mesma posição na árvore (já casados por nome
 * pelo chamador) — tipo/variant, cada propriedade (`raw` da `Expression`,
 * não a árvore de `references` inteira — o que importa pro usuário é "a
 * fórmula mudou", não a extração de referência derivada dela) e os filhos,
 * recursivamente, casados por nome dentro do mesmo pai. */
export function diffControl(path: string, before: Control, after: Control, entries: DiffEntry[]): void {
  diffPrimitive(`${path}.type`, before.type, after.type, entries);
  diffPrimitive(`${path}.variant`, before.variant, after.variant, entries);

  diffRecord(
    `${path}.properties`,
    before.properties,
    after.properties,
    (itemPath, beforeExpr, afterExpr, e) => diffPrimitive(`${itemPath}.raw`, beforeExpr.raw, afterExpr.raw, e),
    entries,
  );

  diffKeyedArray(`${path}.children`, before.children, after.children, (c) => c.name, diffControl, entries);
}
