import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadBytes } from "@/lib/download";
import { useI18n } from "@/lib/i18n/context";
import { ArrowDownToLine, Check, Copy, Printer } from "lucide-react";

type MarkdownDocViewProps = {
  markdown: string;
  downloadFileName: string;
  /** Quando presente, mostra um botão "Baixar PDF" que abre o diálogo de
   * impressão do navegador com este markdown renderizado (ver `lib/print-pdf.ts`). */
  onDownloadPdf?: () => void;
};

/** Visualização de um documento Markdown gerado, com abas pra alternar entre
 * leitura formatada e o texto bruto, além de copiar/baixar o `.md` (e,
 * opcionalmente, baixar como PDF) direto daqui. */
export function MarkdownDocView({
  markdown,
  downloadFileName,
  onDownloadPdf,
}: MarkdownDocViewProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const onDownload = () =>
    downloadBytes(markdown, downloadFileName, "text/markdown");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponível (permissão negada, contexto não seguro) — sem
      // feedback de sucesso; o texto ainda dá pra selecionar na aba Raw.
    }
  };

  return (
    <Tabs
      defaultValue="preview"
      className="gap-3 pb-0 overflow-hidden flex-1 shrink-0 min-h-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="preview">{t.markdownDoc.read}</TabsTrigger>
          <TabsTrigger value="raw">{t.markdownDoc.raw}</TabsTrigger>
        </TabsList>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onCopy} className="min-w-21">
            {copied ? <Check /> : <Copy />}
            {copied ? t.markdownDoc.copied : t.markdownDoc.copy}
          </Button>
          {onDownloadPdf && (
            <Button variant="outline" onClick={onDownloadPdf}>
              <Printer /> {t.markdownDoc.downloadPdf}
            </Button>
          )}
          <Button variant="default" onClick={onDownload}>
            <ArrowDownToLine /> {t.markdownDoc.downloadMd}
          </Button>
        </div>
      </div>

      <TabsContent value="preview" className="p-0! overflow-hidden">
        <ScrollArea className="scroll-fade-b scroll-fade-[10%] h-[76vh] p-4">
          <div className="markdown-body text-sm mb-24">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="raw" className="p-0! overflow-hidden">
        <ScrollArea className="h-[76vh] rounded-lg border bg-muted/30 p-4">
          <pre className="font-mono text-sm whitespace-pre-wrap">
            {markdown}
          </pre>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
