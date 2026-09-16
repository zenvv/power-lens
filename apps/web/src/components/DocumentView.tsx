import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import {
  CloudColor,
  DatabaseColor,
  PhoneLaptopColor,
  PuzzlePieceColor,
  WarningColor,
} from "@fluentui/react-icons";
import { buildContextPack, type PowerLensDocument } from "@power-lens/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { downloadBytes } from "@/lib/download";
import { groupArtifactsByKind } from "@/lib/artifact-groups";
import { FlowDagView } from "@/components/flow/FlowDagView";
import { MerView } from "@/components/mer/MerView";
import { MeasuresPanel } from "@/components/mer/MeasuresPanel";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { WireframeView } from "@/components/wireframe/WireframeView";
import { AiExplanationCard } from "@/components/ai/AiExplanationCard";
import { ArtifactTabs } from "@/components/document/ArtifactTabs";
import { MarkdownDocView } from "@/components/document/MarkdownDocView";
import { SectionHeader } from "@/components/document/SectionHeader";
import { StatTile } from "@/components/document/StatTile";
import type { SectionId } from "@/components/nav/Sidebar";
import openFileFolderIllustration from "@/assets/illustrations/open-file-folder-3d.png";
import robotIllustration from "@/assets/illustrations/robot-3d.png";

type DocumentViewProps = {
  document: PowerLensDocument;
  activeSection: SectionId;
  markdown: string;
  onDownloadMarkdown: () => void;
  onDownloadIr: () => void;
  onRequestAiExplanation: () => void;
  aiAutoGenerateArmed: boolean;
  onAiAutoGenerateConsumed: () => void;
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
export function DocumentView({
  document,
  activeSection,
  markdown,
  onDownloadMarkdown,
  onDownloadIr,
  onRequestAiExplanation,
  aiAutoGenerateArmed,
  onAiAutoGenerateConsumed,
}: DocumentViewProps) {
  const { flows, models, canvasApps } = useMemo(
    () => groupArtifactsByKind(document),
    [document],
  );
  const severityCounts = useMemo(() => {
    const counts = { error: 0, warning: 0, info: 0 };
    for (const d of document.diagnostics) counts[d.severity]++;
    return counts;
  }, [document]);

  const onDownloadContextPack = () => {
    const zipBytes = buildContextPack(document);
    downloadBytes(
      zipBytes,
      `${document.source.fileName}.power-lens-pack.zip`,
      "application/zip",
    );
  };

  return (
    <Tabs
      value={activeSection}
      className="gap-6 w-full shrink-0 flex-1 min-h-full"
    >
      <TabsContent
        value="summary"
        className="flex min-h-full w-full min-w-full flex-1 shrink-0 flex-col"
      >
        {/* Wrapper com altura natural (não `flex-1`/`min-h-full`): o
         * wallpaper decorativo abaixo cobre só o conteúdo de fato, não o
         * espaço vazio que o painel deixa sobrar até o fim da tela.
         * `isolate` cria um stacking context próprio — sem ele, o `-z-10`
         * do wallpaper escapa pra trás do painel branco (`bg-background`)
         * inteiro em vez de só atrás dos irmãos aqui dentro. */}
        <div className="relative isolate flex flex-col gap-4 pb-6">
          {/* Wallpaper decorativo: só nesta seção, atrás das superfícies de
           * vidro fosco dos cards abaixo (`bg-card/*` + `backdrop-blur`).
           * Cores puramente decorativas (paleta padrão do Tailwind, não os
           * tokens de marca) — não carregam significado semântico. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            {/* Sem offsets negativos: o painel em volta rola com
             * `overflow-y-auto`, que recorta qualquer coisa que sangre pra
             * fora da própria caixa (inclusive no eixo X). */}
            <div className="absolute top-0 left-0 size-72 rounded-full bg-emerald-400/40 blur-3xl dark:bg-emerald-500/20" />
            <div className="absolute top-0 right-0 size-64 rounded-full bg-sky-400/35 blur-3xl dark:bg-sky-500/20" />
            <div className="absolute right-0 bottom-32 size-80 rounded-full bg-violet-400/30 blur-3xl dark:bg-violet-500/18" />
            <div className="absolute bottom-0 left-1/4 size-64 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/18" />
          </div>

          <SectionHeader
            title="Resumo"
            description={
              <>
                {document.source.detectedFormat} ·{" "}
                {formatBytes(document.source.fileSize)} · analisado em{" "}
                {new Date(document.source.parsedAt).toLocaleString("pt-BR")} ·
                parser {document.source.parserVersion}
              </>
            }
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              icon={PuzzlePieceColor}
              label="artefato(s)"
              value={document.artifacts.length}
            />
            <StatTile icon={CloudColor} label="fluxo(s)" value={flows.length} />
            <StatTile
              icon={DatabaseColor}
              label="modelo(s) de dados"
              value={models.length}
            />
            <StatTile
              icon={PhoneLaptopColor}
              label="canvas app(s)"
              value={canvasApps.length}
            />
            <StatTile
              icon={WarningColor}
              label="diagnóstico(s)"
              value={document.diagnostics.length}
              detail={`${severityCounts.error} erro(s), ${severityCounts.warning} aviso(s), ${severityCounts.info} info`}
            />
          </div>

          <Card className="relative overflow-hidden bg-card/60 backdrop-blur-xl dark:bg-card/40">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-amber-300),transparent_65%)]/35 dark:bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-amber-500),transparent_65%)]/18"
            />
            <div className="relative flex items-center gap-4">
              <img
                src={openFileFolderIllustration}
                alt=""
                className="hidden size-24 shrink-0 object-contain pl-4 drop-shadow-lg sm:block md:size-24"
              />
              <div className="min-w-0 flex-1">
                <CardHeader>
                  <CardTitle>Exportar</CardTitle>
                  <CardDescription>
                    Tudo gerado no navegador, nada sai da sua máquina.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button onClick={onDownloadMarkdown}>
                    Baixar documentação (.md)
                  </Button>
                  <Button variant="secondary" onClick={onDownloadIr}>
                    Baixar IR (ir.json)
                  </Button>
                  <Button variant="secondary" onClick={onDownloadContextPack}>
                    Baixar pacote de contexto (.zip)
                  </Button>
                </CardContent>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-card/60 backdrop-blur-xl dark:bg-card/40">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-violet-300),transparent_65%)]/35 dark:bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-violet-500),transparent_65%)]/20"
            />
            <div className="relative flex items-center gap-4">
              <img
                src={robotIllustration}
                alt=""
                className="hidden size-24 shrink-0 object-contain pl-4 drop-shadow-lg sm:block md:size-28"
              />
              <div className="min-w-0 flex-1">
                <CardHeader>
                  <CardTitle>Explicação por IA</CardTitle>
                  <CardDescription>
                    Opcional: peça pra um LLM explicar este artefato em
                    linguagem natural, com a sua própria chave.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={onRequestAiExplanation}>
                    <Sparkles /> Gerar explicação por IA
                  </Button>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </TabsContent>

      {flows.length > 0 && (
        <TabsContent value="flows" className="flex flex-col gap-4">
          <SectionHeader
            title="Fluxos"
            description={`${flows.length} fluxo(s) encontrado(s) neste artefato.`}
          />
          <ArtifactTabs
            items={flows}
            description={(flow) => (
              <>
                Gatilho: {flow.trigger.name} · {flow.actions.length} ação(ões) ·
                role a roda pra dar zoom, clique nos grupos pra recolher
              </>
            )}
          >
            {(flow) => <FlowDagView flow={flow} />}
          </ArtifactTabs>
        </TabsContent>
      )}

      {models.length > 0 && (
        <TabsContent value="models" className="flex flex-col gap-4">
          <SectionHeader
            title="Modelos de dados"
            description={`${models.length} modelo(s) encontrado(s) neste artefato.`}
          />
          <ArtifactTabs
            items={models}
            contentClassName="flex flex-col gap-4 lg:flex-row"
            description={(model) => (
              <>
                {model.tables.length} tabela(s) · {model.relationships.length}{" "}
                relacionamento(s) · {model.measures.length} medida(s) · role a
                roda pra dar zoom, clique no cabeçalho da tabela pra recolher as
                colunas, arraste pra reorganizar (posição fica salva)
              </>
            )}
          >
            {(model) => (
              <>
                <div className="min-w-0 flex-1">
                  <MerView model={model} />
                </div>
                <div className="h-[70vh] w-full shrink-0 rounded-lg border lg:w-70">
                  <MeasuresPanel measures={model.measures} />
                </div>
              </>
            )}
          </ArtifactTabs>
        </TabsContent>
      )}

      {canvasApps.length > 0 && (
        <TabsContent value="apps" className="flex flex-col gap-4">
          <SectionHeader
            title="Apps"
            description={`${canvasApps.length} canvas app(s) encontrado(s) neste artefato.`}
          />
          <ArtifactTabs
            items={canvasApps}
            description={() => (
              <>
                Blueprint estático por tela — valores literais/aritmética
                constante são resolvidos, o resto vira placeholder tracejado
                marcado como dinâmico. Não é uma simulação fiel do app rodando.
              </>
            )}
          >
            {(app) => <WireframeView app={app} />}
          </ArtifactTabs>
        </TabsContent>
      )}

      {document.diagnostics.length > 0 && (
        <TabsContent value="diagnostics">
          <DiagnosticsPanel diagnostics={document.diagnostics} />
        </TabsContent>
      )}

      <TabsContent
        value="docs"
        className="flex flex-col min-w-full w-full min-h-full flex-1 shrink-0 gap-4"
      >
        <SectionHeader
          title="Documentação gerada"
          description="Exportação Markdown determinística, sem IA."
        />
        <MarkdownDocView
          markdown={markdown}
          downloadFileName={`${document.source.fileName}.summary.md`}
        />
      </TabsContent>

      <TabsContent value="ai">
        <AiExplanationCard
          document={document}
          autoGenerateOnMount={aiAutoGenerateArmed}
          onAutoGenerateConsumed={onAiAutoGenerateConsumed}
        />
      </TabsContent>
    </Tabs>
  );
}
