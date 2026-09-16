import { useMemo } from "react";
import type { PowerLensDocument } from "@power-lens/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupArtifactsByKind } from "@/lib/artifact-groups";
import { FlowDagView } from "@/components/flow/FlowDagView";
import { FlowTriggerSummary } from "@/components/flow/FlowTriggerSummary";
import { MerView } from "@/components/mer/MerView";
import { MeasuresPanel } from "@/components/mer/MeasuresPanel";
import { LineagePanel } from "@/components/mer/LineagePanel";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { WireframeView } from "@/components/wireframe/WireframeView";
import { ScreenNavMap } from "@/components/canvas/ScreenNavMap";
import { ControlReferencesPanel } from "@/components/canvas/ControlReferencesPanel";
import { ComponentInventory } from "@/components/canvas/ComponentInventory";
import { AiExplanationCard } from "@/components/ai/AiExplanationCard";
import { ArtifactTabs } from "@/components/document/ArtifactTabs";
import { MarkdownDocView } from "@/components/document/MarkdownDocView";
import { SectionHeader } from "@/components/document/SectionHeader";
import { SummarySection } from "@/components/document/SummarySection";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
  const { flows, models, canvasApps, reports } = useMemo(
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
        className="flex min-h-full w-full min-w-full flex-1 shrink-0 flex-col relative p-0! isolate overflow-hidden"
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
        <TabsContent value="flows" className="flex flex-col gap-4 p-6">
          <SectionHeader
            title={t.documentView.flowsTitle}
            description={t.documentView.flowsDescription({ count: flows.length })}
          />
          <ArtifactTabs
            items={flows}
            description={(flow) =>
              t.documentView.flowItemDescription({
                triggerName: flow.trigger.name,
                actionCount: flow.actions.length,
              })
            }
          >
            {(flow) => (
              <div className="flex flex-col gap-3">
                <FlowTriggerSummary trigger={flow.trigger} />
                <FlowDagView flow={flow} />
              </div>
            )}
          </ArtifactTabs>
        </TabsContent>
      )}

      {models.length > 0 && (
        <TabsContent value="models" className="flex flex-col gap-4 p-6">
          <SectionHeader
            title={t.documentView.modelsTitle}
            description={t.documentView.modelsDescription({ count: models.length })}
          />
          <ArtifactTabs
            items={models}
            contentClassName="flex flex-col gap-4 lg:flex-row"
            description={(model) =>
              t.documentView.modelItemDescription({
                tables: model.tables.length,
                relationships: model.relationships.length,
                measures: model.measures.length,
              })
            }
          >
            {(model) => (
              <>
                <div className="min-w-0 flex-1">
                  <MerView model={model} />
                </div>
                <div className="flex h-[70vh] w-full shrink-0 flex-col rounded-lg border lg:w-70">
                  <Tabs defaultValue="measures" className="flex h-full flex-col gap-0">
                    <TabsList className="w-full">
                      <TabsTrigger value="measures">{t.mer.measuresTab}</TabsTrigger>
                      <TabsTrigger value="lineage">{t.mer.lineageTab}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="measures" className="min-h-0 flex-1">
                      <MeasuresPanel measures={model.measures} />
                    </TabsContent>
                    <TabsContent value="lineage" className="min-h-0 flex-1">
                      <LineagePanel model={model} report={reports.find((r) => r.id === `${model.id}-report`)} />
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </ArtifactTabs>
        </TabsContent>
      )}

      {canvasApps.length > 0 && (
        <TabsContent value="apps" className="flex flex-col gap-4 p-6">
          <SectionHeader
            title={t.documentView.appsTitle}
            description={t.documentView.appsDescription({ count: canvasApps.length })}
          />
          <ArtifactTabs
            items={canvasApps}
            description={() => t.documentView.appsItemDescription}
          >
            {(app) => (
              <Tabs defaultValue="wireframe" className="gap-3">
                <TabsList>
                  <TabsTrigger value="wireframe">{t.documentView.appsTabs.wireframe}</TabsTrigger>
                  <TabsTrigger value="navigation">{t.documentView.appsTabs.navigation}</TabsTrigger>
                  <TabsTrigger value="references">{t.documentView.appsTabs.references}</TabsTrigger>
                  <TabsTrigger value="components">{t.documentView.appsTabs.components}</TabsTrigger>
                </TabsList>
                <TabsContent value="wireframe">
                  <WireframeView app={app} />
                </TabsContent>
                <TabsContent value="navigation">
                  <ScreenNavMap app={app} />
                </TabsContent>
                <TabsContent value="references">
                  <ControlReferencesPanel app={app} />
                </TabsContent>
                <TabsContent value="components">
                  <ComponentInventory app={app} />
                </TabsContent>
              </Tabs>
            )}
          </ArtifactTabs>
        </TabsContent>
      )}

      {document.diagnostics.length > 0 && (
        <TabsContent value="diagnostics" className="p-6">
          <DiagnosticsPanel diagnostics={document.diagnostics} />
        </TabsContent>
      )}

      <TabsContent
        value="docs"
        className="flex flex-col min-w-full w-full min-h-full flex-1 shrink-0 gap-4 p-6 pb-0 overflow-hidden"
      >
        <SectionHeader
          title={t.documentView.docsTitle}
          description={t.documentView.docsDescription}
        />
        <MarkdownDocView
          markdown={markdown}
          downloadFileName={`${document.source.fileName}.summary.md`}
        />
      </TabsContent>

      <TabsContent value="ai" className="p-6">
        <AiExplanationCard
          document={document}
          autoGenerateOnMount={aiAutoGenerateArmed}
          onAutoGenerateConsumed={onAiAutoGenerateConsumed}
        />
      </TabsContent>
    </Tabs>
  );
}
