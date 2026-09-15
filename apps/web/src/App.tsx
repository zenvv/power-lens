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
import Navbar from "./components/nav/Navbar.js";
import { Sidebar, type SectionId } from "./components/nav/Sidebar.js";
import { HomeSection } from "./components/HomeSection.js";
import { DocumentView } from "./components/DocumentView.js";
import { ConfirmDialog } from "./components/ConfirmDialog.js";
import { analyzeFile } from "./lib/analyze.js";
import type { AppState } from "./lib/app-state.js";

export function App() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onFile = useCallback((file: File) => {
    setState({ status: "loading", fileName: file.name });
    analyzeFile(file)
      .then((result) => {
        if (result.status === "unrecognized") {
          setState({ status: "unrecognized", fileName: result.fileName, diagnostics: result.diagnostics });
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

  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      <Navbar
        document={document}
        onOpenDiagnostics={() => setActiveSection("diagnostics")}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          document={document}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onRequestImport={onRequestImport}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-6 py-6">
            {document ? (
              <DocumentView document={document} activeSection={activeSection} />
            ) : (
              <HomeSection state={state} onFile={onFile} onRetry={resetToIdle} />
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
  );
}
