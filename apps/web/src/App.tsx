import { useCallback, useState } from "react";
import type { Diagnostic } from "@power-lens/core";
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
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: state.status === "parsed" ? "flex-start" : "center",
        gap: "1.5rem",
        padding: "3rem 1rem",
        fontFamily: "system-ui, sans-serif",
        background: "#0f0f10",
        color: "#e6e6e6",
      }}
    >
      <h1 style={{ margin: 0 }}>Power Lens</h1>

      {(state.status === "idle" || state.status === "loading") && (
        <Dropzone onFile={onFile} disabled={state.status === "loading"} />
      )}

      {state.status === "unrecognized" && (
        <div style={{ width: "min(560px, 90vw)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p>
            Não consegui reconhecer <strong>{state.fileName}</strong> como um arquivo suportado.
          </p>
          <ul>
            {state.diagnostics.map((d, i) => (
              <li key={i}>{d.message}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onReset}
            style={{
              background: "#27272a",
              color: "#e6e6e6",
              border: "1px solid #3a3a3d",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            Tentar outro arquivo
          </button>
        </div>
      )}

      {state.status === "parsed" && <DocumentView document={state.result.document} onReset={onReset} />}
    </main>
  );
}
