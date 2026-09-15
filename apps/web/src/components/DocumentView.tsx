import { useMemo } from "react";
import {
  buildContextPack,
  renderMarkdown,
  type PowerLensDocument,
} from "@power-lens/core";
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

export function DocumentView({ document }: DocumentViewProps) {
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
    <Tabs defaultValue="summary" className="gap-4">
      <div className="overflow-x-auto">
        <TabsList className="w-max">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          {flows.map((flow) => (
            <TabsTrigger key={flow.id} value={`flow-${flow.id}`}>
              Fluxo: {flow.name}
            </TabsTrigger>
          ))}
          {models.map((model) => (
            <TabsTrigger key={model.id} value={`model-${model.id}`}>
              Modelo: {model.name}
            </TabsTrigger>
          ))}
          {canvasApps.map((app) => (
            <TabsTrigger key={app.id} value={`app-${app.id}`}>
              App: {app.name}
            </TabsTrigger>
          ))}
          {document.diagnostics.length > 0 && (
            <TabsTrigger value="diagnostics">
              Diagnósticos <Badge variant="secondary">{document.diagnostics.length}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="docs">Documentação</TabsTrigger>
        </TabsList>
      </div>

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

      {flows.map((flow) => (
        <TabsContent key={flow.id} value={`flow-${flow.id}`}>
          <Card>
            <CardHeader>
              <CardTitle>Fluxo: {flow.name}</CardTitle>
              <CardDescription>
                Gatilho: {flow.trigger.name} · {flow.actions.length} ação(ões) ·
                role a roda pra dar zoom, clique nos grupos pra recolher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FlowDagView flow={flow} />
            </CardContent>
          </Card>
        </TabsContent>
      ))}

      {models.map((model) => (
        <TabsContent key={model.id} value={`model-${model.id}`}>
          <Card>
            <CardHeader>
              <CardTitle>Modelo de dados: {model.name}</CardTitle>
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
        </TabsContent>
      ))}

      {canvasApps.map((app) => (
        <TabsContent key={app.id} value={`app-${app.id}`}>
          <Card>
            <CardHeader>
              <CardTitle>Wireframe: {app.name}</CardTitle>
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
        </TabsContent>
      ))}

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
    </Tabs>
  );
}
