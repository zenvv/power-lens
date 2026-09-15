import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  buildContextPack,
  renderMarkdown,
  type PowerLensDocument,
} from "@power-lens/core";
import { AppWindow, Database, FileText, LayoutDashboard, TriangleAlert, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadBytes } from "@/lib/download";
import { shortArtifactName } from "@/lib/artifact-name";
import { cn } from "@/lib/utils";
import { FlowDagView } from "@/components/flow/FlowDagView";
import { MerView } from "@/components/mer/MerView";
import { MeasuresPanel } from "@/components/mer/MeasuresPanel";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { WireframeView } from "@/components/wireframe/WireframeView";

type DocumentViewProps = {
  document: PowerLensDocument;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

/** Página de uma categoria de artefato (fluxos, modelos, apps). Com um único
 * artefato mostra o conteúdo direto; com mais de um, ganha uma sub-navegação
 * em abas — "quase uma subguia" dentro da página, não mais uma guia solta
 * misturada com as gerais. */
function ArtifactTabs<T extends { id: string; name: string }>({
  items,
  children,
}: {
  items: T[];
  children: (item: T) => ReactNode;
}) {
  if (items.length === 1) return <>{children(items[0]!)}</>;

  return (
    <Tabs defaultValue={items[0]!.id} className="gap-4">
      <div className="overflow-x-auto">
        <TabsList className="w-max">
          {items.map((item) => (
            <TabsTrigger key={item.id} value={item.id} title={item.name}>
              <span className="max-w-48 truncate">{shortArtifactName(item.name)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {items.map((item) => (
        <TabsContent key={item.id} value={item.id}>
          {children(item)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** Item da sidebar principal. Não usa `TabsTrigger`: o `Tabs` do preset
 * escopa `orientation` por classe Tailwind nomeada `group/tabs`, e como as
 * páginas de fluxo/modelo/app abrem um segundo `Tabs` (horizontal) *dentro*
 * do `TabsContent` da sidebar, um `Tabs` vertical ali em cima vazava o
 * estilo "empilhado" pra dentro das sub-abas horizontais — mesmo nome de
 * grupo, o seletor CSS não distingue "ancestral mais próximo". Um nav comum
 * controlando o `value` do `Tabs` por fora evita a colisão de vez. */
function SidebarLink({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string | undefined }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <Badge variant="secondary">{count}</Badge>}
    </button>
  );
}

export function DocumentView({ document }: DocumentViewProps) {
  const [activeSection, setActiveSection] = useState("summary");
  const markdown = useMemo(() => renderMarkdown(document), [document]);
  const flows = useMemo(
    () => document.artifacts.filter((a) => a.kind === "cloudFlow"),
    [document],
  );
  const models = useMemo(
    () => document.artifacts.filter((a) => a.kind === "dataModel"),
    [document],
  );
  const canvasApps = useMemo(
    () => document.artifacts.filter((a) => a.kind === "canvasApp"),
    [document],
  );
  const severityCounts = useMemo(() => {
    const counts = { error: 0, warning: 0, info: 0 };
    for (const d of document.diagnostics) counts[d.severity]++;
    return counts;
  }, [document]);

  const onDownloadMarkdown = () => {
    downloadBytes(
      markdown,
      `${document.source.fileName}.summary.md`,
      "text/markdown",
    );
  };

  const onDownloadIr = () => {
    downloadBytes(
      JSON.stringify(document, null, 2),
      `${document.source.fileName}.ir.json`,
      "application/json",
    );
  };

  const onDownloadContextPack = () => {
    const zipBytes = buildContextPack(document);
    downloadBytes(
      zipBytes,
      `${document.source.fileName}.power-lens-pack.zip`,
      "application/zip",
    );
  };

  return (
    <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 items-start gap-6">
      <nav className="flex w-64 shrink-0 flex-col gap-1">
        <SidebarLink
          active={activeSection === "summary"}
          onClick={() => setActiveSection("summary")}
          icon={LayoutDashboard}
          label="Resumo"
        />

        {flows.length > 0 && (
          <SidebarLink
            active={activeSection === "flows"}
            onClick={() => setActiveSection("flows")}
            icon={Workflow}
            label="Fluxos"
            count={flows.length}
          />
        )}

        {models.length > 0 && (
          <SidebarLink
            active={activeSection === "models"}
            onClick={() => setActiveSection("models")}
            icon={Database}
            label="Modelos de dados"
            count={models.length}
          />
        )}

        {canvasApps.length > 0 && (
          <SidebarLink
            active={activeSection === "apps"}
            onClick={() => setActiveSection("apps")}
            icon={AppWindow}
            label="Apps"
            count={canvasApps.length}
          />
        )}

        {document.diagnostics.length > 0 && (
          <SidebarLink
            active={activeSection === "diagnostics"}
            onClick={() => setActiveSection("diagnostics")}
            icon={TriangleAlert}
            label="Diagnósticos"
            count={document.diagnostics.length}
          />
        )}

        <SidebarLink
          active={activeSection === "docs"}
          onClick={() => setActiveSection("docs")}
          icon={FileText}
          label="Documentação"
        />
      </nav>

      <div className="min-w-0 flex-1">
        <TabsContent value="summary" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo estrutural</CardTitle>
              <CardDescription>
                {document.source.detectedFormat} · {formatBytes(document.source.fileSize)} · analisado em{" "}
                {new Date(document.source.parsedAt).toLocaleString("pt-BR")} · parser {document.source.parserVersion}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6">
              <div>
                <p className="text-xl font-semibold">{document.artifacts.length}</p>
                <p className="text-xs text-muted-foreground">artefato(s)</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{flows.length}</p>
                <p className="text-xs text-muted-foreground">fluxo(s)</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{models.length}</p>
                <p className="text-xs text-muted-foreground">modelo(s) de dados</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{canvasApps.length}</p>
                <p className="text-xs text-muted-foreground">canvas app(s)</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{document.diagnostics.length}</p>
                <p className="text-xs text-muted-foreground">
                  diagnóstico(s) — {severityCounts.error} erro(s), {severityCounts.warning} aviso(s),{" "}
                  {severityCounts.info} info
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportar</CardTitle>
              <CardDescription>Tudo gerado no navegador, nada sai da sua máquina.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={onDownloadMarkdown}>Baixar documentação (.md)</Button>
              <Button variant="secondary" onClick={onDownloadIr}>
                Baixar IR (ir.json)
              </Button>
              <Button variant="secondary" onClick={onDownloadContextPack}>
                Baixar pacote de contexto (.zip)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {flows.length > 0 && (
          <TabsContent value="flows">
            <ArtifactTabs items={flows}>
              {(flow) => (
                <Card>
                  <CardHeader>
                    <CardTitle>{shortArtifactName(flow.name)}</CardTitle>
                    <CardDescription>
                      Gatilho: {flow.trigger.name} · {flow.actions.length} ação(ões) ·
                      role a roda pra dar zoom, clique nos grupos pra recolher
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FlowDagView flow={flow} />
                  </CardContent>
                </Card>
              )}
            </ArtifactTabs>
          </TabsContent>
        )}

        {models.length > 0 && (
          <TabsContent value="models">
            <ArtifactTabs items={models}>
              {(model) => (
                <Card>
                  <CardHeader>
                    <CardTitle>{shortArtifactName(model.name)}</CardTitle>
                    <CardDescription>
                      {model.tables.length} tabela(s) · {model.relationships.length}{" "}
                      relacionamento(s) · {model.measures.length} medida(s) · role a
                      roda pra dar zoom, clique no cabeçalho da tabela pra recolher as
                      colunas, arraste pra reorganizar (posição fica salva)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 lg:flex-row">
                    <div className="min-w-0 flex-1">
                      <MerView model={model} />
                    </div>
                    <div className="h-[70vh] w-full shrink-0 rounded-lg border lg:w-70">
                      <MeasuresPanel measures={model.measures} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </ArtifactTabs>
          </TabsContent>
        )}

        {canvasApps.length > 0 && (
          <TabsContent value="apps">
            <ArtifactTabs items={canvasApps}>
              {(app) => (
                <Card>
                  <CardHeader>
                    <CardTitle>{shortArtifactName(app.name)}</CardTitle>
                    <CardDescription>
                      Blueprint estático por tela — valores literais/aritmética
                      constante são resolvidos, o resto vira placeholder tracejado
                      marcado como dinâmico. Não é uma simulação fiel do app rodando.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WireframeView app={app} />
                  </CardContent>
                </Card>
              )}
            </ArtifactTabs>
          </TabsContent>
        )}

        {document.diagnostics.length > 0 && (
          <TabsContent value="diagnostics">
            <DiagnosticsPanel diagnostics={document.diagnostics} />
          </TabsContent>
        )}

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Documentação gerada</CardTitle>
              <CardDescription>
                Exportação Markdown determinística, sem IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[65vh] rounded-lg border bg-muted/30 p-4">
                <pre className="font-mono text-sm whitespace-pre-wrap">
                  {markdown}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
}
