import type { ArtifactDiff, ArtifactDiffStatus, DiffEntry } from "@power-lens/core";
import { ArrowLeft, Minus, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/context";

type DiffResultPanelProps = {
  fileNameA: string;
  fileNameB: string;
  artifacts: readonly ArtifactDiff[];
  onBack: () => void;
};

const STATUS_ICON: Record<ArtifactDiffStatus, typeof Plus> = { added: Plus, removed: Minus, changed: Pencil };
const STATUS_COLOR: Record<ArtifactDiffStatus, string> = {
  added: "text-emerald-600 dark:text-emerald-400",
  removed: "text-destructive",
  changed: "text-amber-600 dark:text-amber-400",
};

function formatValue(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function DiffEntryRow({ entry }: { entry: DiffEntry }) {
  return (
    <li className="flex flex-col gap-1 px-3 py-2 text-xs">
      <span className="font-mono text-muted-foreground">{entry.path}</span>
      <div className="flex flex-wrap items-center gap-2">
        {entry.before !== undefined && (
          <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-destructive line-through">
            {formatValue(entry.before)}
          </span>
        )}
        {entry.after !== undefined && (
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-emerald-700 dark:text-emerald-400">
            {formatValue(entry.after)}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * Resultado do diff entre dois documentos (Fase 14) — modo à parte, não um
 * `SectionId`: não pertence a um artefato específico, é uma visão do
 * documento inteiro comparado contra outro (ver `App.tsx`, renderizado no
 * lugar do `DocumentView` normal enquanto existir). Ajuste de escopo em
 * relação ao plano original: lista plana por `path` em vez de uma árvore
 * recursiva de verdade — o próprio `path` já é uma string tipo
 * `screens[Screen1].root.children[Label3].properties.Text.raw` que já
 * comunica a posição exata, uma árvore visual só reconstruiria o que o
 * texto já diz.
 */
export function DiffResultPanel({ fileNameA, fileNameB, artifacts, onBack }: DiffResultPanelProps) {
  const { t } = useI18n();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft /> {t.diff.back}
        </Button>
        <div className="min-w-0">
          <h1 className="font-heading text-lg font-semibold">{t.diff.title}</h1>
          <p className="truncate text-sm text-muted-foreground">{t.diff.comparing({ fileNameA, fileNameB })}</p>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.diff.noDifferences}</p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4 pr-3">
            {artifacts.map((artifact) => {
              const Icon = STATUS_ICON[artifact.status];
              return (
                <div key={artifact.key} className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                    <Icon className={`size-4 shrink-0 ${STATUS_COLOR[artifact.status]}`} />
                    <span className="text-sm font-medium">{artifact.key}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {t.diff.statusLabel[artifact.status]}
                    </Badge>
                  </div>
                  {artifact.entries.length > 0 && (
                    <ul className="divide-y">
                      {artifact.entries.map((entry, index) => (
                        <DiffEntryRow key={index} entry={entry} />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
