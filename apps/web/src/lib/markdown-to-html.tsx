import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Converte Markdown pra uma string HTML estática, com o mesmo parser/plugin
 * usado na leitura em tela (`react-markdown` + `remark-gfm`) — usado pra
 * gerar o documento que vai pra janela de impressão/PDF (`lib/print-pdf.ts`),
 * fora da árvore React normal. */
export function markdownToHtml(markdown: string): string {
  return renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>,
  );
}
