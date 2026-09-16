import { useEffect, useMemo, useRef, useState } from "react";
import { buildPromptMd, type PowerLensDocument } from "@power-lens/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AiSettingsDialog } from "./AiSettingsDialog";
import { MarkdownDocView } from "@/components/document/MarkdownDocView";
import { callAiProvider, PROVIDERS } from "@/lib/ai/providers";
import { loadAiSettings, maskApiKey, type AiSettings } from "@/lib/ai/settings-storage";
import { downloadMarkdownAsPdf } from "@/lib/print-pdf";

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
  const [settings, setSettings] = useState<AiSettings | undefined>(() => loadAiSettings());
  const [state, setState] = useState<State>({ status: "idle" });
  const [pdfError, setPdfError] = useState<string | undefined>();

  const prompt = useMemo(
    () => `${buildPromptMd(document)}\n\n---\n\n\`\`\`json\n${JSON.stringify(document, null, 2)}\n\`\`\`\n`,
    [document],
  );

  async function onGenerate() {
    if (!settings) return;
    setPdfError(undefined);
    setState({ status: "loading" });
    try {
      const text = await callAiProvider(settings.provider, settings.apiKey, settings.model, prompt);
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
      `${document.source.fileName} — explicação por IA`,
    );
    if (!opened) {
      setPdfError(
        "Não consegui abrir a janela de impressão — verifique se o navegador bloqueou um pop-up.",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explicação por IA (opcional, BYOK)</CardTitle>
        <CardDescription>
          {settings ? (
            <>
              Chamada direta do seu navegador pro {PROVIDERS[settings.provider].label}, modelo{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
                {settings.model}
              </code>
              , com a chave {maskApiKey(settings.apiKey)}. Nada passa pelo Power Lens.
            </>
          ) : (
            "Configure sua própria chave de API pra pedir uma explicação em linguagem natural do artefato — chamada direta do seu navegador pro provedor, sem passar pelo Power Lens."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <AiSettingsDialog
            onSettingsChange={setSettings}
            trigger={
              <Button variant="outline" size="sm">
                {settings ? "Trocar chave/provedor" : "Configurar chave de API"}
              </Button>
            }
          />
          {settings && (
            <Button size="sm" onClick={onGenerate} disabled={state.status === "loading"}>
              {state.status === "loading" && <Spinner className="size-4" />}
              {state.status === "done" || state.status === "error" ? "Gerar novamente" : "Gerar explicação"}
            </Button>
          )}
        </div>

        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        {pdfError && <p className="text-sm text-destructive">{pdfError}</p>}

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
