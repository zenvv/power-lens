/** Idiomas suportados pela ferramenta — cobre UI (`apps/web`) e conteúdo
 * gerado deterministicamente aqui em `packages/core` (regras, Markdown,
 * pacote de contexto). Sem detecção de idioma do browser: o default é
 * sempre `"en"`, só muda por escolha explícita do usuário. */
export type Locale = "en" | "pt" | "es";

export const DEFAULT_LOCALE: Locale = "en";
