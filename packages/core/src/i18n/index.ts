import { en } from "./messages/en.js";
import { pt } from "./messages/pt.js";
import { es } from "./messages/es.js";
import type { Locale } from "./locale.js";

export type Messages = typeof en;

const DICTIONARIES: Record<Locale, Messages> = { en, pt, es };

/** Dicionário completo pro idioma pedido — regras, render de Markdown e
 * pacote de contexto (namespaces adicionados conforme cada área ganha
 * suporte a locale) buscam texto aqui em vez de ter string PT hardcoded. */
export function getMessages(locale: Locale): Messages {
  return DICTIONARIES[locale];
}

export { type Locale, DEFAULT_LOCALE } from "./locale.js";
