import { useMemo } from "react";
import type { PowerLensDocument } from "@power-lens/core";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { SummarySection } from "@/components/document/SummarySection";
import type { SectionId } from "@/components/nav/Sidebar";

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

  return (
    <Tabs
      value={activeSection}
      className="gap-6 w-full shrink-0 flex-1 min-h-full"
    >
      <TabsContent
        value="summary"
        className="flex min-h-full w-full min-w-full flex-1 shrink-0 flex-col"
      >
        <SummarySection
          document={document}
          flowsCount={flows.length}
          modelsCount={models.length}
          canvasAppsCount={canvasApps.length}
          onDownloadMarkdown={onDownloadMarkdown}
          onDownloadIr={onDownloadIr}
          onRequestAiExplanation={onRequestAiExplanation}
        />
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
