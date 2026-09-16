import type { Diagnostic, PowerLensDocument, Relationship } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Messages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";

function describeRisk(rel: Relationship, reasonLabels: Messages["rules"]["pl014"]["reasons"]): string[] {
  const reasons: string[] = [];
  if (rel.crossFilter === "both") reasons.push(reasonLabels.bidirectional);
  if (rel.cardinality === "manyToMany") reasons.push(reasonLabels.manyToMany);
  return reasons;
}

/** PL014 — relacionamento com uma forma que costuma gerar resultado
 * inesperado em DAX pra quem não sabe que está lá: filtro bidirecional
 * (amplia o filtro pros dois lados, pode duplicar contagem em modelo com
 * mais de uma tabela de fatos) ou cardinalidade muitos-para-muitos (motor
 * trata como fraco, sem garantia de integridade referencial). Não é um erro
 * — em muitos modelos é intencional — por isso severidade "info". */
export function pl014RiskyRelationshipShape(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl014;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "dataModel") continue;

    for (const rel of artifact.relationships) {
      const reasons = describeRisk(rel, messages.reasons);
      if (reasons.length === 0) continue;

      diagnostics.push({
        code: "PL014",
        severity: "info",
        message: messages.message({
          fromTable: rel.from.table,
          fromColumn: rel.from.column,
          toTable: rel.to.table,
          toColumn: rel.to.column,
          reasons: reasons.join(", "),
        }),
        artifactId: artifact.id,
        hint: messages.hint,
      });
    }
  }

  return diagnostics;
}
