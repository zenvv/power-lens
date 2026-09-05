import { useMemo } from "react";
import { buildContextPack, renderMarkdown, type Diagnostic, type PowerLensDocument } from "@power-lens/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { downloadBytes } from "@/lib/download";
import { FlowDagView } from "@/components/flow/FlowDagView";

type DocumentViewProps = {
  document: PowerLensDocument;
  onReset: () => void;
};

const SEVERITY_VARIANT: Record<Diagnostic["severity"], "destructive" | "secondary" | "outline"> = {
  error: "destructive",
  warning: "secondary",
  info: "outline",
};

export function DocumentView({ document, onReset }: DocumentViewProps) {
  const markdown = useMemo(() => renderMarkdown(document), [document]);
  const flows = useMemo(() => document.artifacts.filter((a) => a.kind === "cloudFlow"), [document]);

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
    <div className="flex w-[min(1100px,95vw)] flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{document.source.fileName}</h2>
          <p className="text-sm text-muted-foreground">
            {document.source.detectedFormat} · {document.artifacts.length} artefato(s) · {document.diagnostics.length}{" "}
            diagnóstico(s)
          </p>
        </div>
        <Button variant="outline" onClick={onReset}>
          Analisar outro arquivo
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onDownloadMarkdown}>Baixar documentação (.md)</Button>
        <Button variant="secondary" onClick={onDownloadIr}>
          Baixar IR (ir.json)
        </Button>
        <Button variant="secondary" onClick={onDownloadContextPack}>
          Baixar pacote de contexto (.zip)
        </Button>
      </div>

      {flows.map((flow) => (
        <Card key={flow.id}>
          <CardHeader>
            <CardTitle>Fluxo: {flow.name}</CardTitle>
            <CardDescription>
              Gatilho: {flow.trigger.name} · {flow.actions.length} ação(ões) · role a roda pra dar zoom, clique nos
              grupos pra recolher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FlowDagView flow={flow} />
          </CardContent>
        </Card>
      ))}

      {document.diagnostics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnósticos</CardTitle>
            <CardDescription>Problemas estruturais encontrados durante a análise.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {document.diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.code}-${index}`}>
                  <div className="flex items-center gap-2">
                    <Badge variant={SEVERITY_VARIANT[diagnostic.severity]}>{diagnostic.severity}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{diagnostic.code}</span>
                  </div>
                  <p className="mt-1 text-sm">{diagnostic.message}</p>
                  {diagnostic.path && <p className="mt-0.5 text-xs text-muted-foreground">{diagnostic.path}</p>}
                  {index < document.diagnostics.length - 1 && <Separator className="mt-3" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documentação gerada</CardTitle>
          <CardDescription>Exportação Markdown determinística, sem IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] rounded-lg border bg-muted/30 p-4">
            <pre className="font-mono text-sm whitespace-pre-wrap">{markdown}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
