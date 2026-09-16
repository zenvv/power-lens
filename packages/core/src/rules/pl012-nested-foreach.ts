import type { Diagnostic, FlowNode, PowerLensDocument } from "../ir/index.js";

/** Sobe a cadeia de `parentId` a partir de `node` e diz se algum ancestral é
 * um `Foreach` — cobre o caso comum de um `Foreach` aninhado dentro de um
 * `Scope`/`If` que por sua vez está dentro de outro `Foreach`, não só o pai
 * direto. */
function hasForeachAncestor(node: FlowNode, byId: Map<string, FlowNode>): boolean {
  let current = node.parentId ? byId.get(node.parentId) : undefined;
  while (current) {
    if (current.type === "Foreach") return true;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

/** PL012 — `Foreach` aninhado dentro de outro `Foreach`. Antipadrão de
 * performance conhecido do Power Automate (a Microsoft recomenda achatar com
 * `Select`/`Filter array` antes do loop em vez de aninhar) — escopo
 * deliberadamente restrito a esse caso único e bem documentado, não a outras
 * heurísticas de concorrência do `Foreach` que dependem de configuração não
 * capturada no IR. */
export function pl012NestedForeach(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "cloudFlow") continue;

    const byId = new Map(artifact.actions.map((node) => [node.id, node]));

    for (const node of artifact.actions) {
      if (node.type !== "Foreach") continue;
      if (!hasForeachAncestor(node, byId)) continue;

      diagnostics.push({
        code: "PL012",
        severity: "warning",
        message: `"${node.name}" é um Foreach aninhado dentro de outro Foreach.`,
        artifactId: artifact.id,
        path: node.name,
        hint: "Foreach aninhado é sequencial por natureza e escala mal — considere achatar a lista com Select/Filter array antes de um único loop.",
      });
    }
  }

  return diagnostics;
}
