import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./locale";
import { loadLocale, saveLocale } from "./storage";
import { en } from "./translations/en";
import { pt } from "./translations/pt";
import { es } from "./translations/es";

export type Translations = typeof en;

const DICTIONARIES: Record<Locale, Translations> = { en, pt, es };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/** Provider de idioma da UI — persiste a escolha em localStorage (mesmo
 * padrão de `lib/ai/settings-storage.ts`) e sincroniza `<html lang>` com o
 * locale atual. Default `DEFAULT_LOCALE` ("en") sem detectar
 * `navigator.language`, por pedido explícito do usuário; a única forma de
 * mudar é escolher no rodapé da sidebar. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    saveLocale(next);
  }

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: DICTIONARIES[locale] }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export type { Locale };
export { DEFAULT_LOCALE };
