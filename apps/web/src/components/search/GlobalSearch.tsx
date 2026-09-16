import { useEffect, useMemo, useState } from "react";
import { buildSearchIndex, searchIndex, type PowerLensDocument, type SearchEntry } from "@power-lens/core";
import { AppWindow, Braces, Database, Layers, Table2, Variable, Workflow, type LucideIcon } from "lucide-react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useI18n } from "@/lib/i18n/context";
import type { SectionId } from "@/components/nav/Sidebar";

export type SearchNavigation = {
  section: SectionId;
  artifactId: string;
  screenName?: string | undefined;
  controlName?: string | undefined;
};

type GlobalSearchProps = {
  document: PowerLensDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (navigation: SearchNavigation) => void;
};

const KIND_SECTION: Record<SearchEntry["kind"], SectionId> = {
  control: "apps",
  dataSource: "apps",
  variable: "apps",
  collection: "apps",
  function: "apps",
  screen: "apps",
  component: "apps",
  flowTrigger: "flows",
  flowAction: "flows",
  connection: "flows",
  table: "models",
  column: "models",
  measure: "models",
};

const KIND_ICON: Record<SearchEntry["kind"], LucideIcon> = {
  control: AppWindow,
  dataSource: Database,
  variable: Variable,
  collection: Layers,
  function: Braces,
  screen: AppWindow,
  component: Layers,
  flowTrigger: Workflow,
  flowAction: Workflow,
  connection: Workflow,
  table: Table2,
  column: Table2,
  measure: Table2,
};

/**
 * Resolve tela/controle a partir do `path` de uma entrada de app — o
 * formato varia por `kind` (ver `buildSearchIndex`, núcleo):
 * `control`/`screen`/`component` já têm o `path` certo pra usar direto;
 * uma referência de uso (`dataSource`/`variable`/`collection`/`function`)
 * tem `path` no formato `Tela/Controle.Propriedade`; uma declaração de
 * `dataSource` (sem uso encontrado) tem só o próprio nome, sem "/" — nesse
 * caso não tem tela pra apontar.
 */
function resolveAppsSelection(entry: SearchEntry): { screenName?: string | undefined; controlName?: string | undefined } {
  if (entry.kind === "screen") return { screenName: entry.name };
  if (entry.kind === "component") return {};
  if (entry.kind === "control") {
    const segments = entry.path.split("/");
    return { screenName: segments[0], controlName: segments[segments.length - 1] };
  }
  if (!entry.path.includes("/")) return {};
  const controlPath = entry.path.split(".")[0]!;
  const segments = controlPath.split("/");
  return { screenName: segments[0], controlName: segments[segments.length - 1] };
}

function resolveNavigation(entry: SearchEntry): SearchNavigation {
  const section = KIND_SECTION[entry.kind];
  if (section !== "apps") return { section, artifactId: entry.artifactId };
  return { section, artifactId: entry.artifactId, ...resolveAppsSelection(entry) };
}

/**
 * Busca global (Fase 9) — `buildSearchIndex`/`searchIndex` (núcleo) já
 * fazem a indexação e o filtro; este componente só apresenta e resolve pra
 * onde navegar. Resultado de um controle/tela chega já com a tela/controle
 * certos selecionados no Wireframe (padrão "armado" — ver
 * `WireframeView.initialSelection`); resultado de fluxo/modelo só troca de
 * seção e de artefato selecionado no `ArtifactTabs` (aprofundar a seleção
 * dentro do DAG/MER fica pra um incremento futuro, decisão de escopo já
 * registrada no plano).
 */
export function GlobalSearch({ document, open, onOpenChange, onNavigate }: GlobalSearchProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const index = useMemo(() => buildSearchIndex(document), [document]);
  const results = useMemo(() => searchIndex(index, query).slice(0, 50), [index, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function select(entry: SearchEntry) {
    onNavigate(resolveNavigation(entry));
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t.search.title} description={t.search.placeholder}>
      {/* `shouldFilter={false}`: a filtragem já é feita por `searchIndex`
       * (núcleo) sobre `query` — deixar o `cmdk` filtrar de novo por cima
       * (fuzzy match dele, não o nosso) só divergiria do resultado mostrado. */}
      <Command shouldFilter={false}>
        <CommandInput placeholder={t.search.placeholder} value={query} onValueChange={setQuery} />
        <CommandList>
          {query.trim() !== "" && <CommandEmpty>{t.search.empty}</CommandEmpty>}
          <CommandGroup>
            {results.map((entry, index) => {
              const Icon = KIND_ICON[entry.kind];
              return (
                <CommandItem key={`${entry.artifactId}-${entry.path}-${index}`} value={`${entry.artifactId}-${entry.path}-${index}`} onSelect={() => select(entry)}>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{entry.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {entry.artifactName} · {entry.path}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
