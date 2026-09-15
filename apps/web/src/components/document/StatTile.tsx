import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type StatTileProps = {
  label: string;
  value: number | string;
  detail?: ReactNode;
};

/** Card de métrica curta (número grande + rótulo), no padrão do admin
 * center: uma fileira de fatos rápidos sobre o documento carregado. */
export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <Card className="gap-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
}
