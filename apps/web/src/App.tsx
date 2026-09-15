import { useCallback, useState } from "react";
import type { Diagnostic } from "@power-lens/core";
import { Button } from "@/components/ui/button";
import { Dropzone } from "./components/Dropzone.js";
import { DocumentView } from "./components/DocumentView.js";
import { analyzeFile, type AnalysisResult } from "./lib/analyze.js";
import Navbar from "./components/nav/Navbar.js";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "unrecognized"; fileName: string; diagnostics: Diagnostic[] }
  | { status: "parsed"; result: Extract<AnalysisResult, { status: "parsed" }> };

export function App() {
  const [state, setState] = useState<State>({ status: "idle" });

  const onFile = useCallback((file: File) => {
    setState({ status: "loading" });
    analyzeFile(file)
      .then((result) => {
        if (result.status === "unrecognized") {
          setState({
            status: "unrecognized",
            fileName: result.fileName,
            diagnostics: result.diagnostics,
          });
        } else {
          setState({ status: "parsed", result });
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
      });
  }, []);

  const onReset = useCallback(() => setState({ status: "idle" }), []);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar
        document={state.status === "parsed" ? state.result.document : null}
        onReset={onReset}
      />

      <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col px-6 py-8 sm:px-8">
        {(state.status === "idle" || state.status === "loading") && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Dropzone onFile={onFile} disabled={state.status === "loading"} />
          </div>
        )}

        {state.status === "unrecognized" && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="flex w-[min(560px,90vw)] flex-col gap-4">
              <p className="text-sm">
                Não consegui reconhecer <strong>{state.fileName}</strong> como
                um arquivo suportado.
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {state.diagnostics.map((d, i) => (
                  <li key={i}>{d.message}</li>
                ))}
              </ul>
              <Button variant="outline" className="self-start" onClick={onReset}>
                Tentar outro arquivo
              </Button>
            </div>
          </div>
        )}

        {state.status === "parsed" && (
          <DocumentView document={state.result.document} />
        )}
      </div>
    </main>
  );
}
