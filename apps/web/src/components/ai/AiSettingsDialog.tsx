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
import { useI18n } from "@/lib/i18n/context";

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
  const { t } = useI18n();
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
          <DialogTitle>{t.ai.settingsDialog.title}</DialogTitle>
          <DialogDescription>
            {t.ai.settingsDialog.descriptionPart1}
            <strong>{t.ai.settingsDialog.descriptionBold1}</strong>
            {t.ai.settingsDialog.descriptionPart2}
            <strong>{t.ai.settingsDialog.descriptionBold2}</strong>
            {t.ai.settingsDialog.descriptionPart3}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-provider">{t.ai.settingsDialog.providerLabel}</Label>
            <Select value={provider} onValueChange={onProviderChange}>
              <SelectTrigger id="ai-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">{t.aiProviders.gemini.label}</SelectItem>
                <SelectItem value="anthropic">{t.aiProviders.anthropic.label}</SelectItem>
                <SelectItem value="openai" disabled>
                  {t.ai.settingsDialog.openaiDisabledLabel}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t.ai.settingsDialog.getKeyAt}{" "}
              <a href={PROVIDERS[provider].apiKeyUrl} target="_blank" rel="noreferrer" className="underline">
                {PROVIDERS[provider].apiKeyUrl}
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-model">{t.ai.settingsDialog.modelLabel}</Label>
            <Input id="ai-model" value={model} onChange={(e) => setModel(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t.aiProviders[provider].modelHint}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-key">{t.ai.settingsDialog.apiKeyLabel}</Label>
            <div className="flex gap-2">
              <Input
                id="ai-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t.ai.settingsDialog.apiKeyPlaceholder}
              />
              <Button type="button" variant="outline" onClick={() => setShowKey((v) => !v)}>
                {showKey ? t.ai.settingsDialog.hide : t.ai.settingsDialog.show}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          {hadSavedKey && (
            <Button type="button" variant="outline" onClick={onRemove}>
              {t.ai.settingsDialog.removeKey}
            </Button>
          )}
          <Button type="button" onClick={onSave} disabled={!apiKey.trim()}>
            {t.ai.settingsDialog.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
