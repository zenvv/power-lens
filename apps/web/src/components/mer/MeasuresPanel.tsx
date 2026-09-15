import type { Measure } from "@power-lens/core";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type MeasuresPanelProps = {
  measures: Measure[];
};

/** Painel lateral de medidas (spec seção 7) — separado do diagrama porque uma
 * medida não pertence a um nó, mas a uma tabela dentro dele. */
export function MeasuresPanel({ measures }: MeasuresPanelProps) {
  if (measures.length === 0) {
    return <p className="p-3 text-sm text-muted-foreground">Nenhuma medida neste modelo.</p>;
  }

  return (
    <ScrollArea className="h-full">
      <ul className="flex flex-col gap-3 p-3">
        {measures.map((measure, index) => (
          <li key={`${measure.table}.${measure.name}-${index}`} className="rounded-lg border p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium">{measure.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {measure.table}
              </Badge>
              {measure.formatString && (
                <Badge variant="secondary" className="text-[10px]">
                  {measure.formatString}
                </Badge>
              )}
            </div>
            <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
              {measure.expression}
            </pre>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
