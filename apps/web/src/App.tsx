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
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { Locale } from "@power-lens/core";
import Navbar from "./components/nav/Navbar.js";
import { Sidebar, type SectionId } from "./components/nav/Sidebar.js";
import { HomeSection } from "./components/HomeSection.js";
import { DocumentView } from "./components/DocumentView.js";
import { ConfirmDialog } from "./components/ConfirmDialog.js";
import { MobileGate } from "./components/MobileGate.js";
import { analyzeFile } from "./lib/analyze.js";
import { useDocumentDownloads } from "./lib/use-document-downloads.js";
import { useI18n } from "./lib/i18n/context.js";
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
  const { t, locale } = useI18n();
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

  const onFile = useCallback(
    (file: File) => {
      setState({
        status: "loading",
        fileName: file.name,
        stage: t.analyze.stageDetecting,
      });
      const startedAt = performance.now();

      analyzeFile(file, {
        locale,
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
            setState({ status: "parsed", result, file });
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
                message: t.app.unexpectedError({ error: String(err) }),
              },
            ],
          });
          setActiveSection("home");
        });
    },
    [locale, t],
  );

  /** Troca de idioma depois de já ter importado um arquivo re-roda a análise
   * inteira (parse + health checks) com o novo locale, em vez de deixar
   * diagnóstico/documentação "presos" no idioma da importação original — o
   * `File` original fica guardado em `state` exatamente pra isso. Não passa
   * por `status: "loading"` de propósito: isso desmontaria a sidebar/doc
   * view (`showSidebar`/`document` abaixo) e causaria flicker; é um refresh
   * silencioso, aceitável porque o pipeline já é sub-segundo. `latestLocale`
   * evita aplicar um resultado desatualizado se o usuário trocar de idioma
   * de novo antes da primeira reanálise terminar. */
  const latestLocaleRef = useRef(locale);
  useEffect(() => {
    latestLocaleRef.current = locale;
    if (state.status !== "parsed") return;
    const { file } = state;

    analyzeFile(file, { locale }).then((result) => {
      if (result.status === "parsed" && latestLocaleRef.current === locale) {
        setState({ status: "parsed", result, file });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const resetToIdle = useCallback(() => {
    setState({ status: "idle" });
    setActiveSection("home");
  }, []);

  const onRequestImport = useCallback(() => {
    if (state.status === "parsed") setConfirmImportOpen(true);
  }, [state.status]);

  const document = state.status === "parsed" ? state.result.document : null;
  const { markdown, downloadMarkdown, downloadIr } =
    useDocumentDownloads(document, locale);
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
                onRequestImport={onRequestImport}
                mobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          <div className="min-w-0 flex-1 p-3 pt-0">
            <div className="mx-auto flex h-full w-full flex-col overflow-y-auto rounded-lg border bg-background ">
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
          title={t.app.confirmImportTitle}
          description={
            state.status === "parsed"
              ? t.app.confirmImportDescParsed({ fileName: state.result.document.source.fileName })
              : t.app.confirmImportDescGeneric
          }
          confirmLabel={t.app.confirmImportLabel}
          onConfirm={resetToIdle}
        />
      </main>
    </>
  );
}
