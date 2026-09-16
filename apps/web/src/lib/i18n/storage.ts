import { DEFAULT_LOCALE, type Locale } from "./locale";

const STORAGE_KEY = "power-lens:locale";

const VALID_LOCALES: readonly Locale[] = ["en", "pt", "es"];

/** Sem detecção de `navigator.language` — o default é sempre `DEFAULT_LOCALE`
 * ("en") quando não há nada salvo, por pedido explícito do usuário. */
export function loadLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (VALID_LOCALES as readonly string[]).includes(raw)) return raw as Locale;
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage indisponível (modo privado, cota cheia) — a preferência
    // simplesmente não persiste entre sessões.
  }
}
