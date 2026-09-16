import { useMemo } from "react";
import { buildComponentInventory, type CanvasApp } from "@power-lens/core";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";

type ComponentInventoryProps = { app: CanvasApp };

/** Inventário de componentes reutilizáveis (Fase 11) — `buildComponentInventory`
 * (núcleo) já devolve a contagem, incluindo componente com uso zero. */
export function ComponentInventory({ app }: ComponentInventoryProps) {
  const { t } = useI18n();
  const inventory = useMemo(
    () => [...buildComponentInventory(app)].sort((a, b) => b.usageCount - a.usageCount),
    [app],
  );

  if (inventory.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.canvasComponents.none}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.canvasComponents.nameColumn}</TableHead>
          <TableHead className="text-right">{t.canvasComponents.usageColumn}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((component) => (
          <TableRow key={component.name}>
            <TableCell className="font-medium">{component.name}</TableCell>
            <TableCell className="text-right">
              {component.usageCount === 0 ? (
                <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                  {t.canvasComponents.unused}
                </Badge>
              ) : (
                component.usageCount
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
