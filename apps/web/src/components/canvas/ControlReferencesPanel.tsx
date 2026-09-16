import { useMemo, useState } from "react";
import { buildControlReferenceGraph, type CanvasApp, type Control, type ReferenceKind } from "@power-lens/core";
import { AppWindow, Code, Database, Layers, MousePointer2, Variable, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanvasTreeView } from "@/components/wireframe/CanvasTreeView";
import { useI18n } from "@/lib/i18n/context";

type ControlReferencesPanelProps = { app: CanvasApp };

const KIND_ICON: Record<ReferenceKind, LucideIcon> = {
  control: MousePointer2,
  dataSource: Database,
  variable: Variable,
  collection: Layers,
  function: Code,
  screen: AppWindow,
};

/** Acha o caminho (`Tela/Filho/Neto`, mesma convenção de
 * `Diagnostic.path`/`buildControlReferenceGraph`) até o primeiro controle
 * com esse nome dentro da árvore da tela — busca em profundidade, para no
 * primeiro achado (nome de controle é único dentro de uma tela na prática). */
function findControlPath(control: Control, targetName: string, currentPath: string): string | undefined {
  if (control.name === targetName) return currentPath;
  for (const child of control.children) {
    const found = findControlPath(child, targetName, `${currentPath}/${child.name}`);
    if (found) return found;
  }
  return undefined;
}

/**
 * Painel de referências de um controle (Fase 11) — ajuste de escopo em
 * relação ao plano original: em vez de um grafo visual (topologia estrela,
 * um controle no centro e N referências ao redor não ganha nada de um
 * layout de grafo de verdade), reusa o `CanvasTreeView` do Wireframe como
 * seletor de tela/controle e lista as referências que saem dele
 * (`buildControlReferenceGraph`, núcleo), agrupadas visualmente por ícone
 * de tipo.
 */
export function ControlReferencesPanel({ app }: ControlReferencesPanelProps) {
  const { t } = useI18n();
  const sortedScreens = useMemo(() => [...app.screens].sort((a, b) => a.order - b.order), [app.screens]);
  const [selectedScreenName, setSelectedScreenName] = useState<string | undefined>(sortedScreens[0]?.name);
  const [selectedControlName, setSelectedControlName] = useState<string>();
  const selectedScreen = sortedScreens.find((s) => s.name === selectedScreenName) ?? sortedScreens[0];

  const edges = useMemo(() => buildControlReferenceGraph(app), [app]);

  const selectedPath = useMemo(() => {
    if (!selectedScreen) return undefined;
    if (!selectedControlName) return selectedScreen.name;
    return findControlPath(selectedScreen.root, selectedControlName, selectedScreen.name);
  }, [selectedScreen, selectedControlName]);

  const references = useMemo(() => edges.filter((edge) => edge.from === selectedPath), [edges, selectedPath]);

  if (!selectedScreen) {
    return <p className="text-sm text-muted-foreground">{t.wireframe.noScreens}</p>;
  }

  return (
    <div className="flex gap-3">
      <CanvasTreeView
        screens={sortedScreens}
        selectedScreenName={selectedScreen.name}
        onSelectScreen={(name) => {
          setSelectedScreenName(name);
          setSelectedControlName(undefined);
        }}
        selectedControlName={selectedControlName}
        onSelectControl={setSelectedControlName}
      />

      <div className="flex min-w-0 flex-1 flex-col rounded-lg border">
        <div className="border-b p-2 text-xs text-muted-foreground">
          {t.canvasReferences.selectedLabel({ name: selectedControlName ?? selectedScreen.name })}
        </div>
        <ScrollArea className="h-[65vh]">
          {references.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{t.canvasReferences.none}</p>
          ) : (
            <ul className="flex flex-col gap-2 p-3">
              {references.map((reference, index) => {
                const Icon = KIND_ICON[reference.toKind];
                return (
                  <li key={index} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{reference.toName}</span>
                    <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                      {t.canvasReferences.kindLabel[reference.toKind]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
