import { useMemo, useState } from "react";
import { buildLineageIndex, type DataModel, type Report } from "@power-lens/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/context";

type LineagePanelProps = {
  model: DataModel;
  /** `undefined` quando o modelo não veio de um `.pbit` com `Report/Layout`
   * (ex.: tabelas Dataverse) — nesse caso não tem como saber se uma coluna é
   * usada num relatório, então a UI diz isso em vez de listar tudo como
   * "não usada" (seria enganoso, não é a mesma coisa). */
  report: Report | undefined;
};

/** Painel de lineage coluna/medida → visual (Fase 16) — mesmo estilo do
 * `MeasuresPanel` (ScrollArea + cards), com um filtro rápido pra só mostrar
 * o que nunca aparece em nenhum visual (reforça PL013 de forma navegável). */
export function LineagePanel({ model, report }: LineagePanelProps) {
  const { t } = useI18n();
  const [onlyUnused, setOnlyUnused] = useState(false);
  const entries = useMemo(() => buildLineageIndex(model, report), [model, report]);

  if (!report) {
    return <p className="p-3 text-sm text-muted-foreground">{t.lineage.noReport}</p>;
  }

  const visible = onlyUnused ? entries.filter((e) => e.visuals.length === 0) : entries;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b p-2">
        <span className="text-xs text-muted-foreground">
          {t.lineage.unusedCount({ count: entries.filter((e) => e.visuals.length === 0).length })}
        </span>
        <Button variant={onlyUnused ? "default" : "outline"} size="xs" onClick={() => setOnlyUnused((v) => !v)}>
          {t.lineage.onlyUnusedToggle}
        </Button>
      </div>

      <ScrollArea className="h-full">
        <ul className="flex flex-col gap-3 p-3">
          {visible.map((entry) => (
            <li key={`${entry.table}.${entry.name}.${entry.kind}`} className="rounded-lg border p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium">{entry.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {entry.table}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {entry.kind === "measure" ? t.lineage.kindMeasure : t.lineage.kindColumn}
                </Badge>
              </div>
              {entry.visuals.length === 0 ? (
                <p className="mt-1.5 text-[11px] text-muted-foreground">{t.lineage.unused}</p>
              ) : (
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {entry.visuals.map((visual, index) => (
                    <li key={index} className="text-[11px] text-muted-foreground">
                      {visual.pageName} · {visual.visualTitle ?? visual.visualType}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
