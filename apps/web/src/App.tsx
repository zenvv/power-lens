import { useCallback, useState } from "react";
import type { Diagnostic } from "@power-lens/core";
import { Button } from "@/components/ui/button";
import { Dropzone } from "./components/Dropzone.js";
import { DocumentView } from "./components/DocumentView.js";
import { analyzeFile, type AnalysisResult } from "./lib/analyze.js";

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
          setState({ status: "unrecognized", fileName: result.fileName, diagnostics: result.diagnostics });
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
    <main
      className={
        "flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-12 text-foreground " +
        (state.status === "parsed" ? "justify-start" : "justify-center")
      }
    >
      <h1 className="font-heading text-3xl font-semibold">Power Lens</h1>

      {(state.status === "idle" || state.status === "loading") && (
        <Dropzone onFile={onFile} disabled={state.status === "loading"} />
      )}

      {state.status === "unrecognized" && (
        <div className="flex w-[min(560px,90vw)] flex-col gap-4">
          <p className="text-sm">
            Não consegui reconhecer <strong>{state.fileName}</strong> como um arquivo suportado.
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
      )}

      {state.status === "parsed" && <DocumentView document={state.result.document} onReset={onReset} />}
    </main>
  );
}
