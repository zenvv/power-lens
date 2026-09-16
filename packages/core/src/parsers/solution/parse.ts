import { createEmptyDocument, type Diagnostic, type PowerLensDocument, type SolutionMeta } from "../../ir/index.js";
import { parseFlow } from "../flow/index.js";
import { parseMsapp } from "../msapp/index.js";
import { readText, unzipNormalized } from "../zip.js";
import { parseCustomizationsXml } from "./customizations-xml.js";
import { linkDependencies } from "./link-dependencies.js";
import { parseSolutionXml } from "./solution-xml.js";

export type SolutionSource = {
  fileName: string;
  fileSize: number;
};

/**
 * Parses a Dataverse solution .zip. `solution.xml`'s own shape is still
 * unverified against a real file (docs/FORMAT-NOTES.md section 2), but
 * `customizations.xml` (Dataverse tables) is now parsed against the
 * official CustomizationsSolution.xsd schema (FORMAT-NOTES.md seção 2.1) —
 * verified against Microsoft's published schema, not yet against a real
 * exported solution. Also reuses the msapp parser for embedded
 * CanvasApps/*.msapp and the flow parser for Workflows/*.json. Whether
 * Workflows/*.json actually shares definition.json's shape is itself
 * unverified — the flow parser degrades to a diagnostic per file if it
 * doesn't. Never throws — every failure degrades to a Diagnostic on the
 * returned document.
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

  const customizationsXmlText = readText(entries, "customizations.xml");
  let dataModel: ReturnType<typeof parseCustomizationsXml> | undefined;
  if (customizationsXmlText !== undefined) {
    dataModel = parseCustomizationsXml(customizationsXmlText, solutionMeta?.id ?? "dataverse-tables", diagnostics);
    if (dataModel) {
      document.artifacts.push(dataModel);
    } else {
      diagnostics.push({
        code: "PL306",
        severity: "info",
        message: "customizations.xml encontrado, mas nenhuma tabela Dataverse foi reconhecida nele.",
      });
    }
  }

  if (msappPaths.length === 0 && workflowPaths.length === 0 && !solutionMeta && !dataModel) {
    diagnostics.push({
      code: "PL307",
      severity: "warning",
      message: "Nenhum artefato reconhecido dentro da solution (nem CanvasApps/*.msapp, nem Workflows/*.json, nem solution.xml válido).",
    });
  }

  document.dependencies = linkDependencies(document, diagnostics);
  document.diagnostics = diagnostics;
  return document;
}
