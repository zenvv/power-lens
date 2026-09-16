/**
 * Direção do redesign (referência: Power Platform admin center).
 * THESIS: navegação lateral persistente por seção, não uma página de import
 * separada — "importar arquivo" é só o primeiro item da mesma navegação.
 * OWN-WORLD: rail claro com grupos (`sidebar-*` tokens já existentes),
 * barra superior compacta e sólida, cards de métrica em fileira no Resumo.
 * STORY: usuário chega, importa (com feedback rápido de leitura), navega
 * pelas seções do documento; trocar de arquivo com algo já carregado passa
 * por confirmação, porque descarta a visualização atual.
 * FORM: fixado pelo brief do usuário (screenshots do admin center) — sem
 * sorteio de conceito.
 */
import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import Navbar from "./components/nav/Navbar.js";
import { Sidebar, type SectionId } from "./components/nav/Sidebar.js";
import { HomeSection } from "./components/HomeSection.js";
import { DocumentView } from "./components/DocumentView.js";
import { ConfirmDialog } from "./components/ConfirmDialog.js";
import { MobileGate } from "./components/MobileGate.js";
import { analyzeFile } from "./lib/analyze.js";
import { useDocumentDownloads } from "./lib/use-document-downloads.js";
import type { AppState } from "./lib/app-state.js";

/** Piso artificial pro estado de loading — parsing real costuma terminar em
 * poucos ms, mas um flash instantâneo lê como "não fez nada". Decisão de
 * design otimista (ver docs/changelog), não uma tentativa de esconder que é
 * rápido: as etapas mostradas continuam sendo as reais do pipeline. */
const MIN_LOADING_MS = 1000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function App() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiAutoGenerateArmed, setAiAutoGenerateArmed] = useState(false);

  /** Atalho "Gerar explicação por IA" do Resumo: navega pra aba de IA e
   * arma a geração automática (só dispara de fato se já houver chave
   * configurada — ver `AiExplanationCard`). */
  const onRequestAiExplanation = useCallback(() => {
    setActiveSection("ai");
    setAiAutoGenerateArmed(true);
  }, []);

  const onAiAutoGenerateConsumed = useCallback(() => {
    setAiAutoGenerateArmed(false);
  }, []);

  const onOpenAi = useCallback(() => {
    setActiveSection("ai");
  }, []);

  const onFile = useCallback((file: File) => {
    setState({
      status: "loading",
      fileName: file.name,
      stage: "Detectando formato do arquivo",
    });
    const startedAt = performance.now();

    analyzeFile(file, {
      onStage: (stage) =>
        setState((s) => (s.status === "loading" ? { ...s, stage } : s)),
    })
      .then(async (result) => {
        const elapsed = performance.now() - startedAt;
        if (elapsed < MIN_LOADING_MS) await wait(MIN_LOADING_MS - elapsed);

        if (result.status === "unrecognized") {
          setState({
            status: "unrecognized",
            fileName: result.fileName,
            diagnostics: result.diagnostics,
          });
          setActiveSection("home");
        } else {
          setState({ status: "parsed", result });
          setActiveSection("summary");
        }
      })
      .catch((err: unknown) => {
        setState({
          status: "unrecognized",
          fileName: file.name,
          diagnostics: [
            {
              code: "PL999",
              severity: "error",
              message: `Erro inesperado ao analisar o arquivo: ${String(err)}`,
            },
          ],
        });
        setActiveSection("home");
      });
  }, []);

  const resetToIdle = useCallback(() => {
    setState({ status: "idle" });
    setActiveSection("home");
  }, []);

  const onRequestImport = useCallback(() => {
    if (state.status === "parsed") setConfirmImportOpen(true);
  }, [state.status]);

  const document = state.status === "parsed" ? state.result.document : null;
  const { markdown, downloadMarkdown, downloadIr } =
    useDocumentDownloads(document);
  /** A tela de upload (idle) é o único momento sem navegação lateral — assim
   * que algo começa a acontecer (loading, erro, documento) a navegação passa
   * a fazer sentido e desliza pra dentro. */
  const showSidebar = state.status !== "idle";

  return (
    <>
      <div className="md:hidden">
        <MobileGate />
      </div>

      <main className="hidden h-screen flex-col bg-sidebar text-foreground md:flex">
        <Navbar
          document={document}
          showSidebarToggle={showSidebar}
          onOpenDiagnostics={() => setActiveSection("diagnostics")}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onRequestImport={onRequestImport}
          onDownloadMarkdown={downloadMarkdown}
          onDownloadIr={downloadIr}
          onOpenAi={onOpenAi}
        />

        <div className="flex min-h-0 flex-1 w-full">
          <AnimatePresence>
            {showSidebar && (
              <Sidebar
                document={document}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                mobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          <div className="min-w-0 flex-1 p-3 pt-0">
            <div className="mx-auto flex h-full w-full flex-col overflow-y-auto rounded-lg border bg-background px-6 py-6">
              {document ? (
                <>
                  <DocumentView
                    document={document}
                    activeSection={activeSection}
                    markdown={markdown}
                    onDownloadMarkdown={downloadMarkdown}
                    onDownloadIr={downloadIr}
                    onRequestAiExplanation={onRequestAiExplanation}
                    aiAutoGenerateArmed={aiAutoGenerateArmed}
                    onAiAutoGenerateConsumed={onAiAutoGenerateConsumed}
                  />
                </>
              ) : (
                <HomeSection
                  state={state}
                  onFile={onFile}
                  onRetry={resetToIdle}
                />
              )}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmImportOpen}
          onOpenChange={setConfirmImportOpen}
          title="Importar outro arquivo?"
          description={
            state.status === "parsed"
              ? `Isso descarta a análise atual de "${state.result.document.source.fileName}" e volta pra tela de importação. Nada fica salvo entre análises.`
              : "Isso descarta a análise atual e volta pra tela de importação."
          }
          confirmLabel="Importar outro arquivo"
          onConfirm={resetToIdle}
        />
      </main>
    </>
  );
}
