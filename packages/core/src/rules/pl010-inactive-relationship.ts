import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";

/** PL010 — relacionamento marcado como inativo no modelo (só utilizável via
 * `USERELATIONSHIP` em DAX; não participa do filtro automático entre
 * tabelas). Não é um erro — vale sinalizar pra confirmar que é
 * intencional. */
export function pl010InactiveRelationship(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl010;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "dataModel") continue;

    for (const rel of artifact.relationships) {
      if (rel.isActive) continue;
      diagnostics.push({
        code: "PL010",
        severity: "info",
        message: messages.message({
          fromTable: rel.from.table,
          fromColumn: rel.from.column,
          toTable: rel.to.table,
          toColumn: rel.to.column,
        }),
        artifactId: artifact.id,
        hint: messages.hint,
      });
    }
  }

  return diagnostics;
}
