import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, TriangleAlert } from "lucide-react";
import { buildPromptMd, type PowerLensDocument } from "@power-lens/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AiSettingsDialog } from "./AiSettingsDialog";
import { MarkdownDocView } from "@/components/document/MarkdownDocView";
import { callAiProvider } from "@/lib/ai/providers";
import { loadAiSettings, maskApiKey, type AiSettings } from "@/lib/ai/settings-storage";
import { downloadMarkdownAsPdf } from "@/lib/print-pdf";
import { useI18n } from "@/lib/i18n/context";

type AiExplanationCardProps = {
  document: PowerLensDocument;
  /** Quando true na montagem, dispara `onGenerate` automaticamente (se já
   * houver chave configurada) — usado pelo atalho "Gerar explicação por IA"
   * do Resumo, que já traz o usuário direto pra cá. */
  autoGenerateOnMount?: boolean;
  onAutoGenerateConsumed?: () => void;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error"; message: string };

/**
 * Camada de IA opcional (spec seção 9) — reusa o mesmo prompt do context
 * pack (`buildPromptMd`), só que chamado automaticamente em vez de colado
 * manualmente num LLM. A explicação gerada usa o mesmo visualizador Markdown
 * da aba "Documentação" (`MarkdownDocView`), com botão extra de PDF.
 */
export function AiExplanationCard({
  document,
  autoGenerateOnMount,
  onAutoGenerateConsumed,
}: AiExplanationCardProps) {
  const { t, locale } = useI18n();
  const [settings, setSettings] = useState<AiSettings | undefined>(() => loadAiSettings());
  const [state, setState] = useState<State>({ status: "idle" });
  const [pdfError, setPdfError] = useState<string | undefined>();

  const prompt = useMemo(
    () => `${buildPromptMd(document, locale)}\n\n---\n\n\`\`\`json\n${JSON.stringify(document, null, 2)}\n\`\`\`\n`,
    [document, locale],
  );

  async function onGenerate() {
    if (!settings) return;
    setPdfError(undefined);
    setState({ status: "loading" });
    try {
      const text = await callAiProvider(settings.provider, settings.apiKey, settings.model, prompt, locale);
      setState({ status: "done", text });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  // Só roda na montagem (o card remonta a cada vez que a aba "ai" fica
  // ativa, porque as `TabsContent` inativas desmontam) — captura o
  // `settings` carregado nesta montagem, dispara e "consome" o atalho pra
  // não regerar sozinho se o usuário sair e voltar pela sidebar depois.
  const onGenerateRef = useRef(onGenerate);
  onGenerateRef.current = onGenerate;
  useEffect(() => {
    if (autoGenerateOnMount) {
      if (settings) onGenerateRef.current();
      onAutoGenerateConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDownloadPdf = () => {
    if (state.status !== "done") return;
    const opened = downloadMarkdownAsPdf(
      state.text,
      t.ai.explanationCard.pdfDocTitle({ fileName: document.source.fileName }),
    );
    if (!opened) {
      setPdfError(t.ai.explanationCard.pdfErrorMessage);
    }
  };

  const isBusy = state.status === "loading";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.ai.explanationCard.title}</CardTitle>
        <CardDescription>{t.ai.explanationCard.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {settings ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <KeyRound className="size-3.5 shrink-0" />
              <span className="font-medium text-foreground">
                {t.aiProviders[settings.provider].label}
              </span>
              <span aria-hidden="true">·</span>
              <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.7rem]">
                {settings.model}
              </code>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{t.ai.explanationCard.keyLabel({ key: maskApiKey(settings.apiKey) })}</span>
            </div>
            <AiSettingsDialog
              onSettingsChange={setSettings}
              trigger={
                <Button variant="ghost" size="sm" disabled={isBusy}>
                  {t.ai.explanationCard.swap}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-3 py-3">
            <p className="text-xs text-muted-foreground">{t.ai.explanationCard.noKeyConfigured}</p>
            <AiSettingsDialog
              onSettingsChange={setSettings}
              trigger={<Button size="sm">{t.ai.explanationCard.configureKey}</Button>}
            />
          </div>
        )}

        {settings && (
          <Button onClick={onGenerate} disabled={isBusy} className="self-start">
            {isBusy && <Spinner className="size-4" />}
            {isBusy
              ? t.ai.explanationCard.generating
              : state.status === "done" || state.status === "error"
                ? t.ai.explanationCard.regenerate
                : t.ai.explanationCard.generate}
          </Button>
        )}

        {state.status === "error" && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{t.ai.explanationCard.errorTitle}</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {pdfError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{t.ai.explanationCard.pdfErrorTitle}</AlertTitle>
            <AlertDescription>{pdfError}</AlertDescription>
          </Alert>
        )}

        {state.status === "done" && (
          <MarkdownDocView
            markdown={state.text}
            downloadFileName={`${document.source.fileName}.ai-explanation.md`}
            onDownloadPdf={onDownloadPdf}
          />
        )}
      </CardContent>
    </Card>
  );
}
