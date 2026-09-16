import { useMemo } from "react";
import { renderMarkdown, DEFAULT_LOCALE, type Locale, type PowerLensDocument } from "@power-lens/core";
import { downloadBytes } from "./download";

/** Documentação Markdown e download dela/do IR — usados tanto na navbar
 * (atalhos rápidos) quanto no card "Exportar" do Resumo, daí ficar num hook
 * compartilhado em vez de duplicar o `renderMarkdown` nos dois lugares. */
export function useDocumentDownloads(document: PowerLensDocument | null, locale: Locale = DEFAULT_LOCALE) {
  const markdown = useMemo(() => (document ? renderMarkdown(document, locale) : ""), [document, locale]);

  function downloadMarkdown() {
    if (!document) return;
    downloadBytes(markdown, `${document.source.fileName}.summary.md`, "text/markdown");
  }

  function downloadIr() {
    if (!document) return;
    downloadBytes(JSON.stringify(document, null, 2), `${document.source.fileName}.ir.json`, "application/json");
  }

  return { markdown, downloadMarkdown, downloadIr };
}
