import { useMemo } from "react";
import { buildContextPack, renderMarkdown, type PowerLensDocument } from "@power-lens/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { downloadBytes } from "@/lib/download";
import { shortArtifactName } from "@/lib/artifact-name";
import { groupArtifactsByKind } from "@/lib/artifact-groups";
import { FlowDagView } from "@/components/flow/FlowDagView";
import { MerView } from "@/components/mer/MerView";
import { MeasuresPanel } from "@/components/mer/MeasuresPanel";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { WireframeView } from "@/components/wireframe/WireframeView";
import { AiExplanationCard } from "@/components/ai/AiExplanationCard";
import { ArtifactTabs } from "@/components/document/ArtifactTabs";
import { SectionHeader } from "@/components/document/SectionHeader";
import { StatTile } from "@/components/document/StatTile";
import type { SectionId } from "@/components/nav/Sidebar";

type DocumentViewProps = {
  document: PowerLensDocument;
  activeSection: SectionId;
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

/** Conteúdo de um documento analisado, por seção. A navegação entre seções
 * é controlada de fora (`Sidebar`, no shell do app) — aqui só existe o
 * conteúdo de cada uma. */
export function DocumentView({ document, activeSection }: DocumentViewProps) {
  const markdown = useMemo(() => renderMarkdown(document), [document]);
  const { flows, models, canvasApps } = useMemo(() => groupArtifactsByKind(document), [document]);
  const severityCounts = useMemo(() => {
    const counts = { error: 0, warning: 0, info: 0 };
    for (const d of document.diagnostics) counts[d.severity]++;
    return counts;
  }, [document]);

  const onDownloadMarkdown = () => {
    downloadBytes(markdown, `${document.source.fileName}.summary.md`, "text/markdown");
  };

  const onDownloadIr = () => {
    downloadBytes(JSON.stringify(document, null, 2), `${document.source.fileName}.ir.json`, "application/json");
  };

  const onDownloadContextPack = () => {
    const zipBytes = buildContextPack(document);
    downloadBytes(zipBytes, `${document.source.fileName}.power-lens-pack.zip`, "application/zip");
  };

  return (
    <Tabs value={activeSection} className="gap-6">
      <TabsContent value="summary" className="flex flex-col gap-4">
        <SectionHeader
          title="Resumo"
          description={
            <>
              {document.source.detectedFormat} · {formatBytes(document.source.fileSize)} · analisado em{" "}
              {new Date(document.source.parsedAt).toLocaleString("pt-BR")} · parser{" "}
              {document.source.parserVersion}
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="artefato(s)" value={document.artifacts.length} />
          <StatTile label="fluxo(s)" value={flows.length} />
          <StatTile label="modelo(s) de dados" value={models.length} />
          <StatTile label="canvas app(s)" value={canvasApps.length} />
          <StatTile
            label="diagnóstico(s)"
            value={document.diagnostics.length}
            detail={`${severityCounts.error} erro(s), ${severityCounts.warning} aviso(s), ${severityCounts.info} info`}
          />
        </div>

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
        <TabsContent value="flows" className="flex flex-col gap-4">
          <SectionHeader title="Fluxos" description={`${flows.length} fluxo(s) encontrado(s) neste artefato.`} />
          <ArtifactTabs items={flows}>
            {(flow) => (
              <Card>
                <CardHeader>
                  <CardTitle>{shortArtifactName(flow.name)}</CardTitle>
                  <CardDescription>
                    Gatilho: {flow.trigger.name} · {flow.actions.length} ação(ões) · role a roda pra dar zoom,
                    clique nos grupos pra recolher
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
        <TabsContent value="models" className="flex flex-col gap-4">
          <SectionHeader
            title="Modelos de dados"
            description={`${models.length} modelo(s) encontrado(s) neste artefato.`}
          />
          <ArtifactTabs items={models}>
            {(model) => (
              <Card>
                <CardHeader>
                  <CardTitle>{shortArtifactName(model.name)}</CardTitle>
                  <CardDescription>
                    {model.tables.length} tabela(s) · {model.relationships.length} relacionamento(s) ·{" "}
                    {model.measures.length} medida(s) · role a roda pra dar zoom, clique no cabeçalho da tabela
                    pra recolher as colunas, arraste pra reorganizar (posição fica salva)
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
        <TabsContent value="apps" className="flex flex-col gap-4">
          <SectionHeader title="Apps" description={`${canvasApps.length} canvas app(s) encontrado(s) neste artefato.`} />
          <ArtifactTabs items={canvasApps}>
            {(app) => (
              <Card>
                <CardHeader>
                  <CardTitle>{shortArtifactName(app.name)}</CardTitle>
                  <CardDescription>
                    Blueprint estático por tela — valores literais/aritmética constante são resolvidos, o resto
                    vira placeholder tracejado marcado como dinâmico. Não é uma simulação fiel do app rodando.
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
            <CardDescription>Exportação Markdown determinística, sem IA.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[65vh] rounded-lg border bg-muted/30 p-4">
              <pre className="font-mono text-sm whitespace-pre-wrap">{markdown}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai">
        <AiExplanationCard document={document} />
      </TabsContent>
    </Tabs>
  );
}
