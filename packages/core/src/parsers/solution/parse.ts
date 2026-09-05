import { createEmptyDocument, type Diagnostic, type PowerLensDocument, type SolutionMeta } from "../../ir/index.js";
import { parseFlow } from "../flow/index.js";
import { parseMsapp } from "../msapp/index.js";
import { readText, unzipNormalized } from "../zip.js";
import { parseSolutionXml } from "./solution-xml.js";

export type SolutionSource = {
  fileName: string;
  fileSize: number;
};

/**
 * Parses a Dataverse solution .zip. The internal structure is unverified
 * against a real file (docs/FORMAT-NOTES.md section 2) — this extracts what
 * it can confidently recognize (solution.xml metadata, embedded
 * CanvasApps/*.msapp reused via the msapp parser, Workflows/*.json reused
 * via the flow parser) and leaves customizations.xml tables as an honest
 * "not parsed in this phase yet" diagnostic (Dataverse tables are Fase 3).
 * Whether Workflows/*.json actually shares definition.json's shape is
 * itself unverified (docs/FORMAT-NOTES.md section 2) — the flow parser
 * degrades to a diagnostic per file if it doesn't. Never throws — every
 * failure degrades to a Diagnostic on the returned document.
 */
export function parseSolution(bytes: Uint8Array, source: SolutionSource): PowerLensDocument {
  const document = createEmptyDocument({ ...source, detectedFormat: "solution" });
  const diagnostics: Diagnostic[] = [];

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipNormalized(bytes);
  } catch (err) {
    diagnostics.push({
      code: "PL300",
      severity: "error",
      message: `Não foi possível abrir o arquivo como zip: ${String(err)}`,
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const solutionXmlText = readText(entries, "solution.xml");
  let solutionMeta: SolutionMeta | undefined;

  if (solutionXmlText === undefined) {
    diagnostics.push({
      code: "PL304",
      severity: "warning",
      message: "solution.xml não encontrado no zip; metadados da solution não estarão disponíveis.",
    });
  } else {
    const manifest = parseSolutionXml(solutionXmlText, diagnostics);
    if (manifest) {
      solutionMeta = {
        kind: "solutionMeta",
        id: manifest.uniqueName,
        name: manifest.displayName,
        version: manifest.version,
        publisher: manifest.publisherDisplayName ?? manifest.publisherUniqueName,
      };
      document.artifacts.push(solutionMeta);
    }
  }

  const msappPaths = Object.keys(entries)
    .filter((path) => /^CanvasApps\/.*\.msapp$/i.test(path))
    .sort();

  for (const path of msappPaths) {
    const innerBytes = entries[path];
    if (!innerBytes) continue;

    const innerDocument = parseMsapp(innerBytes, { fileName: path, fileSize: innerBytes.byteLength });
    document.artifacts.push(...innerDocument.artifacts);
    for (const diagnostic of innerDocument.diagnostics) {
      diagnostics.push({ ...diagnostic, path: diagnostic.path ? `${path}!${diagnostic.path}` : path });
    }
  }

  const workflowPaths = Object.keys(entries)
    .filter((path) => /^Workflows\/.*\.json$/i.test(path))
    .sort();

  for (const path of workflowPaths) {
    const workflowBytes = entries[path];
    if (!workflowBytes) continue;

    const flowDocument = parseFlow(workflowBytes, { fileName: path, fileSize: workflowBytes.byteLength });
    document.artifacts.push(...flowDocument.artifacts);
    for (const diagnostic of flowDocument.diagnostics) {
      diagnostics.push({ ...diagnostic, path: diagnostic.path ? `${path}!${diagnostic.path}` : path });
    }
  }

  if (entries["customizations.xml"] !== undefined) {
    diagnostics.push({
      code: "PL306",
      severity: "info",
      message: "customizations.xml encontrado, mas tabelas Dataverse ainda não são parseadas nesta fase.",
    });
  }

  if (msappPaths.length === 0 && workflowPaths.length === 0 && !solutionMeta) {
    diagnostics.push({
      code: "PL307",
      severity: "warning",
      message: "Nenhum artefato reconhecido dentro da solution (nem CanvasApps/*.msapp, nem Workflows/*.json, nem solution.xml válido).",
    });
  }

  document.diagnostics = diagnostics;
  return document;
}
