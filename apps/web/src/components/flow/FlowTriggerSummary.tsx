import { Clock, HelpCircle, MousePointerClick, Webhook, type LucideIcon } from "lucide-react";
import { summarizeTrigger, type CloudFlow, type TriggerCategory } from "@power-lens/core";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import type { Translations } from "@/lib/i18n/context";

type FlowTriggerSummaryProps = { trigger: CloudFlow["trigger"] };

const CATEGORY_ICON: Record<TriggerCategory, LucideIcon> = {
  scheduled: Clock,
  manual: MousePointerClick,
  event: Webhook,
  unknown: HelpCircle,
};

/** `recurrence` chega como `unknown` do núcleo (repasse bruto do
 * `definition.json`, nunca validado contra um arquivo real — ver
 * docs/FORMAT-NOTES.md item 18). Lê `frequency`/`interval` de forma
 * defensiva: se a forma não bater, cai no texto genérico de "roda numa
 * agenda" em vez de quebrar ou mostrar `undefined`. */
function readRecurrence(recurrence: unknown): { interval: number; frequency: string } | undefined {
  if (typeof recurrence !== "object" || recurrence === null) return undefined;
  const { frequency, interval } = recurrence as { frequency?: unknown; interval?: unknown };
  if (typeof frequency !== "string" || typeof interval !== "number") return undefined;
  return { interval, frequency };
}

function frequencyLabel(t: Translations, frequency: string): string {
  const key = frequency.toLowerCase() as keyof Translations["flow"]["trigger"]["frequency"];
  return t.flow.trigger.frequency[key] ?? frequency;
}

function triggerLabel(t: Translations, category: TriggerCategory, trigger: CloudFlow["trigger"], recurrence: unknown): string {
  switch (category) {
    case "scheduled": {
      const parsed = readRecurrence(recurrence);
      return parsed
        ? t.flow.trigger.scheduledWithSchedule({ interval: parsed.interval, frequency: frequencyLabel(t, parsed.frequency) })
        : t.flow.trigger.scheduled;
    }
    case "manual":
      return t.flow.trigger.manual;
    case "event":
      return trigger.connectorName ? t.flow.trigger.event({ connectorName: trigger.connectorName }) : t.flow.trigger.eventGeneric;
    case "unknown":
      return t.flow.trigger.unknown({ type: trigger.type });
  }
}

/** Card compacto acima do DAG mostrando "quando esse fluxo roda" —
 * `summarizeTrigger` (núcleo) só classifica e repassa dado bruto; o texto
 * final é decidido aqui, incluindo a leitura defensiva de `recurrence`
 * (decisão da Fase 10: núcleo devolve dado, UI decide a frase). */
export function FlowTriggerSummary({ trigger }: FlowTriggerSummaryProps) {
  const { t } = useI18n();
  const summary = summarizeTrigger(trigger);
  const Icon = CATEGORY_ICON[summary.category];

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm">{triggerLabel(t, summary.category, trigger, summary.recurrence)}</span>
      </CardContent>
    </Card>
  );
}
