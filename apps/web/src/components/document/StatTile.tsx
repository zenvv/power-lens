import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/card";

type StatTileProps = {
  label: string;
  value: number | string;
  detail?: ReactNode;
  icon: ComponentType<{ className?: string }>;
};

/** Card de métrica curta (ícone + número grande + rótulo), no padrão do
 * admin center: uma fileira de fatos rápidos sobre o documento carregado.
 * Superfície de vidro fosco (`bg-card/*` + `backdrop-blur`) pra deixar o
 * gradiente de fundo do Resumo (ver `DocumentView`) passar por baixo. */
export function StatTile({ label, value, detail, icon: Icon }: StatTileProps) {
  return (
    <Card className="gap-3 bg-card/60 px-4 py-3 backdrop-blur-xl dark:bg-card/40">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center">
          <Icon className="size-8" />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl leading-none font-semibold tabular-nums">
            {value}
          </p>
        </div>
      </div>
      {detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}
    </Card>
  );
}
