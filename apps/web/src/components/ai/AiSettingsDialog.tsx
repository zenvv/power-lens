import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDERS, type AiProvider } from "@/lib/ai/providers";
import { clearAiSettings, loadAiSettings, saveAiSettings, type AiSettings } from "@/lib/ai/settings-storage";

type AiSettingsDialogProps = {
  onSettingsChange: (settings: AiSettings | undefined) => void;
  trigger: React.ReactNode;
};

/**
 * Config de BYOK (spec seção 9). A OpenAI aparece desabilitada no seletor —
 * a API dela não libera CORS pra chamada direta do browser, então não dá
 * pra suportar sem um backend/proxy, o que contrariaria o princípio
 * client-side only do projeto (ver `lib/ai/providers.ts`).
 */
export function AiSettingsDialog({ onSettingsChange, trigger }: AiSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [model, setModel] = useState(PROVIDERS.gemini.defaultModel);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hadSavedKey, setHadSavedKey] = useState(false);

  useEffect(() => {
    if (!open) return;
    const current = loadAiSettings();
    if (current) {
      setProvider(current.provider);
      setModel(current.model);
      setApiKey(current.apiKey);
      setHadSavedKey(true);
    } else {
      setHadSavedKey(false);
    }
  }, [open]);

  function onProviderChange(next: string) {
    const nextProvider = next as AiProvider;
    setProvider(nextProvider);
    // Só troca o modelo pro default do novo provedor se o usuário não tinha
    // customizado o campo — evita apagar uma edição manual sem querer.
    if (model === PROVIDERS[provider].defaultModel) {
      setModel(PROVIDERS[nextProvider].defaultModel);
    }
  }

  function onSave() {
    const settings: AiSettings = { provider, model: model.trim() || PROVIDERS[provider].defaultModel, apiKey: apiKey.trim() };
    saveAiSettings(settings);
    onSettingsChange(settings);
    setOpen(false);
  }

  function onRemove() {
    clearAiSettings();
    setApiKey("");
    setHadSavedKey(false);
    onSettingsChange(undefined);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chave de API (BYOK)</DialogTitle>
          <DialogDescription>
            Sua chave fica salva só no <strong>localStorage deste navegador</strong>. As chamadas vão{" "}
            <strong>direto daqui pro provedor selecionado</strong> — nunca passam pelo Power Lens nem por nenhum
            servidor nosso, porque o Power Lens não tem servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-provider">Provedor</Label>
            <Select value={provider} onValueChange={onProviderChange}>
              <SelectTrigger id="ai-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">{PROVIDERS.gemini.label}</SelectItem>
                <SelectItem value="anthropic">{PROVIDERS.anthropic.label}</SelectItem>
                <SelectItem value="openai" disabled>
                  OpenAI — API não libera CORS pra chamada direta do browser
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pegue uma chave em{" "}
              <a href={PROVIDERS[provider].apiKeyUrl} target="_blank" rel="noreferrer" className="underline">
                {PROVIDERS[provider].apiKeyUrl}
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-model">Modelo</Label>
            <Input id="ai-model" value={model} onChange={(e) => setModel(e.target.value)} />
            <p className="text-xs text-muted-foreground">{PROVIDERS[provider].modelHint}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-key">Chave de API</Label>
            <div className="flex gap-2">
              <Input
                id="ai-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="cole sua chave aqui"
              />
              <Button type="button" variant="outline" onClick={() => setShowKey((v) => !v)}>
                {showKey ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          {hadSavedKey && (
            <Button type="button" variant="outline" onClick={onRemove}>
              Remover chave
            </Button>
          )}
          <Button type="button" onClick={onSave} disabled={!apiKey.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
