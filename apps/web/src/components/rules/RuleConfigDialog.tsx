import { useEffect, useState } from "react";
import { getRuleRegistry, type RuleConfigMap, type RuleDescriptor } from "@power-lens/core";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { loadRuleConfig, saveRuleConfig } from "@/lib/rules/rule-config-storage";
import { useI18n } from "@/lib/i18n/context";

type RuleConfigDialogProps = {
  onConfigChange: (config: RuleConfigMap | undefined) => void;
  trigger: React.ReactNode;
};

/**
 * Liga/desliga cada regra de health check e ajusta o limiar das que aceitam
 * (PL005/PL006) — `packages/core` já expõe `getRuleRegistry(locale)`
 * (metadado traduzido) e `runHealthChecks(doc, configs?, locale?)`; este
 * diálogo só persiste a escolha e devolve pro chamador re-analisar.
 */
export function RuleConfigDialog({ onConfigChange, trigger }: RuleConfigDialogProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<RuleConfigMap>({});
  const registry = getRuleRegistry(locale);

  useEffect(() => {
    if (!open) return;
    setConfig(loadRuleConfig() ?? {});
  }, [open]);

  function isEnabled(rule: RuleDescriptor): boolean {
    return config[rule.code]?.enabled ?? true;
  }

  function optionValue(rule: RuleDescriptor, optionKey: string, defaultValue: number): number {
    // `RuleOptions` é uma forma fixa (`maxLines`/`minOccurrences`/`locale`),
    // não um `Record<string, number>` — `optionKey` só vem de
    // `RuleOptionDef.key`, sempre um desses dois campos numéricos, então o
    // cast é seguro pra indexar dinamicamente aqui.
    const options = config[rule.code]?.options as Record<string, number> | undefined;
    return options?.[optionKey] ?? defaultValue;
  }

  function toggleRule(code: string, enabled: boolean) {
    setConfig((prev) => ({ ...prev, [code]: { ...prev[code], enabled } }));
  }

  function setOption(code: string, optionKey: string, min: number, defaultValue: number, rawValue: string) {
    const parsed = Number(rawValue);
    const value = Number.isFinite(parsed) ? Math.max(min, parsed) : defaultValue;
    setConfig((prev) => ({
      ...prev,
      [code]: { enabled: prev[code]?.enabled ?? true, options: { ...prev[code]?.options, [optionKey]: value } },
    }));
  }

  function onSave() {
    saveRuleConfig(config);
    onConfigChange(config);
    setOpen(false);
  }

  function onReset() {
    setConfig({});
    saveRuleConfig({});
    onConfigChange(undefined);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.ruleConfig.title}</DialogTitle>
          <DialogDescription>{t.ruleConfig.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-3">
          <div className="flex flex-col gap-3">
            {registry.map((rule) => (
              <div key={rule.code} className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`rule-${rule.code}`} className="flex-1 text-sm font-medium">
                    <span className="mr-1.5 font-mono text-xs text-muted-foreground">{rule.code}</span>
                    {rule.label}
                  </Label>
                  <Switch
                    id={`rule-${rule.code}`}
                    checked={isEnabled(rule)}
                    onCheckedChange={(checked) => toggleRule(rule.code, checked)}
                  />
                </div>

                {rule.options && isEnabled(rule) && (
                  <div className="flex flex-wrap gap-3 pl-1">
                    {rule.options.map((option) => (
                      <div key={option.key} className="flex items-center gap-2">
                        <Label htmlFor={`rule-${rule.code}-${option.key}`} className="text-xs text-muted-foreground">
                          {option.label}
                        </Label>
                        <Input
                          id={`rule-${rule.code}-${option.key}`}
                          type="number"
                          min={option.min}
                          className="h-7 w-20"
                          value={optionValue(rule, option.key, option.defaultValue)}
                          onChange={(e) => setOption(rule.code, option.key, option.min, option.defaultValue, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onReset}>
            {t.ruleConfig.resetAll}
          </Button>
          <Button type="button" onClick={onSave}>
            {t.ruleConfig.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
