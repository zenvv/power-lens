import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

/** Cabeçalho de página de seção dentro do documento (tipo "Security
 * overview" no admin center): título + descrição à esquerda, ação opcional
 * à direita. Usado nas seções de topo do `DocumentView` que ainda não têm
 * um card próprio com header. */
export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
