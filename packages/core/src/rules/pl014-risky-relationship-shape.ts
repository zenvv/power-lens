import type { Diagnostic, PowerLensDocument, Relationship } from "../ir/index.js";

function describeRisk(rel: Relationship): string[] {
  const reasons: string[] = [];
  if (rel.crossFilter === "both") reasons.push("filtragem cruzada bidirecional");
  if (rel.cardinality === "manyToMany") reasons.push("cardinalidade muitos-para-muitos");
  return reasons;
}

/** PL014 — relacionamento com uma forma que costuma gerar resultado
 * inesperado em DAX pra quem não sabe que está lá: filtro bidirecional
 * (amplia o filtro pros dois lados, pode duplicar contagem em modelo com
 * mais de uma tabela de fatos) ou cardinalidade muitos-para-muitos (motor
 * trata como fraco, sem garantia de integridade referencial). Não é um erro
 * — em muitos modelos é intencional — por isso severidade "info". */
export function pl014RiskyRelationshipShape(doc: PowerLensDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "dataModel") continue;

    for (const rel of artifact.relationships) {
      const reasons = describeRisk(rel);
      if (reasons.length === 0) continue;

      diagnostics.push({
        code: "PL014",
        severity: "info",
        message: `Relacionamento ${rel.from.table}.${rel.from.column} → ${rel.to.table}.${rel.to.column} tem forma arriscada: ${reasons.join(", ")}.`,
        artifactId: artifact.id,
        hint: "Confirme se é intencional — filtro bidirecional e muitos-para-muitos são fontes comuns de resultado errado em medidas DAX.",
      });
    }
  }

  return diagnostics;
}
