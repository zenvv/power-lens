import { useMemo } from "react";
import { buildContextPack, renderMarkdown, type PowerLensDocument } from "@power-lens/core";
import { downloadBytes } from "../lib/download.js";

type DocumentViewProps = {
  document: PowerLensDocument;
  onReset: () => void;
};

const SEVERITY_COLOR: Record<string, string> = {
  error: "#f87171",
  warning: "#fbbf24",
  info: "#7dd3fc",
};

export function DocumentView({ document, onReset }: DocumentViewProps) {
  const markdown = useMemo(() => renderMarkdown(document), [document]);

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
    <div style={{ width: "min(920px, 92vw)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>{document.source.fileName}</h2>
          <p style={{ margin: "0.25rem 0 0", opacity: 0.7 }}>
            {document.source.detectedFormat} · {document.artifacts.length} artefato(s) · {document.diagnostics.length} diagnóstico(s)
          </p>
        </div>
        <button type="button" onClick={onReset} style={buttonStyle}>
          Analisar outro arquivo
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button type="button" onClick={onDownloadMarkdown} style={buttonStyle}>
          Baixar documentação (.md)
        </button>
        <button type="button" onClick={onDownloadIr} style={buttonStyle}>
          Baixar IR (ir.json)
        </button>
        <button type="button" onClick={onDownloadContextPack} style={buttonStyle}>
          Baixar pacote de contexto (.zip)
        </button>
      </div>

      {document.diagnostics.length > 0 && (
        <section>
          <h3 style={{ marginBottom: "0.5rem" }}>Diagnósticos</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {document.diagnostics.map((diagnostic, index) => (
              <li
                key={`${diagnostic.code}-${index}`}
                style={{
                  borderLeft: `3px solid ${SEVERITY_COLOR[diagnostic.severity] ?? "#888"}`,
                  paddingLeft: "0.75rem",
                }}
              >
                <strong>{diagnostic.code}</strong> ({diagnostic.severity}) — {diagnostic.message}
                {diagnostic.path && <div style={{ opacity: 0.6, fontSize: "0.85em" }}>{diagnostic.path}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>Documentação gerada</h3>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#18181a",
            padding: "1rem",
            borderRadius: "8px",
            maxHeight: "60vh",
            overflow: "auto",
          }}
        >
          {markdown}
        </pre>
      </section>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: "#27272a",
  color: "#e6e6e6",
  border: "1px solid #3a3a3d",
  borderRadius: "8px",
  padding: "0.5rem 1rem",
  cursor: "pointer",
  fontSize: "0.9rem",
};
