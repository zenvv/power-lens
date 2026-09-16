import { markdownToHtml } from "./markdown-to-html";

/** CSS solto (sem Tailwind — a janela de impressão é um documento isolado,
 * sem o bundle da app) que espelha a leitura em tela o suficiente pra um PDF
 * legível: título, listas, código, tabela, citação. */
const PRINT_STYLES = `
  @page { margin: 2cm; }
  html, body {
    background: #fff;
    color: #1a1a1a;
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
  }
  article { max-width: 100%; }
  h1, h2, h3, h4 { font-weight: 600; line-height: 1.25; }
  h1 { font-size: 20pt; margin: 0 0 12pt; }
  h2 { font-size: 16pt; margin: 20pt 0 8pt; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }
  h3 { font-size: 13pt; margin: 16pt 0 6pt; }
  h4 { font-size: 11.5pt; margin: 12pt 0 4pt; }
  p { margin: 6pt 0; }
  ul, ol { margin: 6pt 0; padding-left: 1.4em; }
  li { margin: 2pt 0; }
  a { color: #1a1a1a; }
  strong { font-weight: 600; }
  hr { border: none; border-top: 1px solid #ddd; margin: 14pt 0; }
  blockquote { margin: 8pt 0; padding-left: 10pt; border-left: 3px solid #ddd; color: #444; }
  code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.9em; background: #f2f2f2; border-radius: 3px; padding: 1pt 3pt; }
  pre { background: #f2f2f2; border-radius: 6pt; padding: 8pt 10pt; overflow-x: auto; page-break-inside: avoid; }
  pre code { background: transparent; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 10pt 0; font-size: 0.95em; page-break-inside: avoid; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; }
  th { background: #f2f2f2; font-weight: 600; }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Abre o Markdown renderizado numa janela nova e dispara o diálogo de
 * impressão do navegador, com "Salvar como PDF" — não gera o PDF em si, o
 * navegador faz isso, o que evita puxar uma dependência de PDF client-side
 * só pra isso (spec seção 3: client-side only, sem servidor). Retorna
 * `false` quando a janela não abre (pop-up bloqueado), pra quem chamou
 * avisar o usuário.
 */
export function downloadMarkdownAsPdf(markdown: string, title: string): boolean {
  const html = markdownToHtml(markdown);
  const printWindow = window.open("", "_blank", "width=880,height=1120");
  if (!printWindow) return false;

  const safeTitle = escapeHtml(title);
  printWindow.document.open();
  printWindow.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><style>${PRINT_STYLES}</style></head><body><article>${html}</article></body></html>`,
  );
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") {
    triggerPrint();
  } else {
    printWindow.addEventListener("load", triggerPrint, { once: true });
  }
  printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });

  return true;
}
