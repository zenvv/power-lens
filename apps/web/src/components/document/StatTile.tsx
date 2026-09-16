import type { ComponentType, ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: number | string;
  detail?: ReactNode;
  icon: ComponentType<{ className?: string }>;
};

/** Card de métrica curta (ícone + número grande + rótulo), no padrão do
 * admin center: uma fileira de fatos rápidos sobre o documento carregado.
 * Superfície de vidro fosco (`bg-card/*` + `backdrop-blur`) pra deixar o
 * wallpaper do Resumo (ver `SummarySection`) passar por baixo; no hover a
 * opacidade some (bg sólido) e a sombra cresce, como feedback de que o
 * card é "tocável" mesmo sem ação de clique associada. */
export function StatTile({ label, value, detail, icon: Icon }: StatTileProps) {
  return (
    <div className="h-full gap-3 bg-card/50 hover:to-primary p-4 shadow-md backdrop-blur-xl transition-all duration-200 hover:shadow-lg group outline-4 outline-transparent hover:outline-primary/20 hover:-outline-offset-2 outline-offset-0 border rounded-xl hover:border-primary">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center bg-linear-to-t from-muted to-muted/60 border rounded-lg">
          <Icon className="size-6 text-muted-foreground group-hover:text-sidebar-primary" />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-xs text-muted-foreground uppercase tracking-tight">
            {label}
          </p>
          <p className="font-heading text-xl leading-none font-semibold tabular-nums">
            {value}
          </p>
        </div>
      </div>
      {detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  );
}
