import type { Diagnostic, PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages } from "../i18n/index.js";
import type { RuleOptions } from "./index.js";

/**
 * Lista deliberadamente curta e conservadora — só conectores que aparecem
 * repetidamente como exemplo canônico de "premium" na documentação da
 * Microsoft (ex.: a Developer Plan guide lista "Salesforce, DB2, e muitos
 * outros" como exemplo de conector premium). Prefere sub-detectar a
 * super-detectar: a ausência de aviso aqui não é prova de que o conector é
 * standard, só que não está nesta lista.
 */
export const KNOWN_PREMIUM_CONNECTOR_IDS = new Set([
  "sql",
  "salesforce",
  "sap",
  "oracledatabase",
  "db2",
  "documentdb",
  "servicenow",
  "workday",
]);

/** PL009 — fonte de dados que usa um conector premium conhecido (exige
 * licença acima do plano gratuito/per-app padrão). */
export function pl009PremiumConnector(doc: PowerLensDocument, options?: RuleOptions): Diagnostic[] {
  const messages = getMessages(options?.locale ?? DEFAULT_LOCALE).rules.pl009;
  const diagnostics: Diagnostic[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind !== "canvasApp") continue;

    for (const dataSource of artifact.dataSources) {
      if (!dataSource.connectorId || !KNOWN_PREMIUM_CONNECTOR_IDS.has(dataSource.connectorId)) continue;
      diagnostics.push({
        code: "PL009",
        severity: "info",
        message: messages.message({ dataSourceName: dataSource.name, connectorId: dataSource.connectorId }),
        artifactId: artifact.id,
        hint: messages.hint,
      });
    }
  }

  return diagnostics;
}
