import { useMemo, useState } from "react";
import { buildPromptMd, type PowerLensDocument } from "@power-lens/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { AiSettingsDialog } from "./AiSettingsDialog";
import { callAiProvider, PROVIDERS } from "@/lib/ai/providers";
import { loadAiSettings, type AiSettings } from "@/lib/ai/settings-storage";

type AiExplanationCardProps = {
  document: PowerLensDocument;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error"; message: string };

/**
 * Camada de IA opcional (spec seção 9) — reusa o mesmo prompt do context
 * pack (`buildPromptMd`), só que chamado automaticamente em vez de colado
 * manualmente num LLM.
 */
export function AiExplanationCard({ document }: AiExplanationCardProps) {
  const [settings, setSettings] = useState<AiSettings | undefined>(() => loadAiSettings());
  const [state, setState] = useState<State>({ status: "idle" });

  const prompt = useMemo(
    () => `${buildPromptMd(document)}\n\n---\n\n\`\`\`json\n${JSON.stringify(document, null, 2)}\n\`\`\`\n`,
    [document],
  );

  async function onGenerate() {
    if (!settings) return;
    setState({ status: "loading" });
    try {
      const text = await callAiProvider(settings.provider, settings.apiKey, settings.model, prompt);
      setState({ status: "done", text });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explicação por IA (opcional, BYOK)</CardTitle>
        <CardDescription>
          {settings
            ? `Chamada direta do seu navegador pro ${PROVIDERS[settings.provider].label}, com a sua chave. Nada passa pelo Power Lens.`
            : "Configure sua própria chave de API pra pedir uma explicação em linguagem natural do artefato — chamada direta do seu navegador pro provedor, sem passar pelo Power Lens."}
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
              Gerar explicação
            </Button>
          )}
        </div>

        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        {state.status === "done" && (
          <ScrollArea className="h-[40vh] rounded-lg border bg-muted/30 p-4">
            <p className="whitespace-pre-wrap text-sm">{state.text}</p>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
