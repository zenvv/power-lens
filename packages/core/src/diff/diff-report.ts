import type { Report } from "../ir/index.js";
import { diffKeyedArray, diffPlain, diffPrimitive, type DiffEntry } from "./diff-utils.js";

/**
 * `Visual` não tem nome/id estável no IR (spec seção 5: `{ type, title?,
 * fields }`) — comparar item a item exigiria casar por posição, frágil
 * quando um visual é inserido no meio de uma página. Em vez disso, a lista
 * inteira de `visuals` de uma página vira uma unidade só (`diffPlain`):
 * "os visuais desta página mudaram", sem apontar qual item específico —
 * limitação documentada, não uma omissão silenciosa.
 */
export function diffReport(before: Report, after: Report): DiffEntry[] {
  const entries: DiffEntry[] = [];

  diffKeyedArray(
    "pages",
    before.pages,
    after.pages,
    (page) => page.name,
    (path, b, a, e) => {
      diffPrimitive(`${path}.order`, b.order, a.order, e);
      diffPlain(`${path}.visuals`, b.visuals, a.visuals, e);
    },
    entries,
  );

  return entries;
}
