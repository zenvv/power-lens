import type { Diagnostic, PowerLensDocument } from "../ir/index.js";

/** PL010 — relacionamento marcado como inativo no modelo (só utilizável via
 * `USERELATIONSHIP` em DAX; não participa do filtro automático entre
 * tabelas). Não é um erro — vale sinalizar pra confirmar que é
 * intencional. */
export function pl010InactiveRelationship(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "dataModel") continue;

    for (const rel of artifact.relationships) {
      if (rel.isActive) continue;
      diagnostics.push({
        code: "PL010",
        severity: "info",
        message: `Relacionamento ${rel.from.table}.${rel.from.column} → ${rel.to.table}.${rel.to.column} está inativo.`,
        artifactId: artifact.id,
        hint: "Só é aplicado explicitamente via USERELATIONSHIP em uma medida DAX — confirme se é intencional.",
      });
    }
  }

  return diagnostics;
}
