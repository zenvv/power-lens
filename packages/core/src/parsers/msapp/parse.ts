import { createEmptyDocument, type CanvasApp, type Diagnostic, type PowerLensDocument } from "../../ir/index.js";
import { parseAppMetadata } from "./app-metadata.js";
import { parseDataSources } from "./data-sources.js";
import { extractVariableUsages } from "./references.js";
import { parseSourceFiles } from "./source-files.js";
import { collectControlNames, collectFormulaBodies, finalizeReferences } from "./walk.js";
import { unzipNormalized } from "./zip.js";

export type MsappSource = {
  fileName: string;
  fileSize: number;
};

/**
 * Parses a .msapp (new Src/*.pa.yaml format) into a PowerLensDocument.
 * Never throws for malformed input — every failure degrades to a Diagnostic
 * on the returned document (spec principle: "degradação honesta").
 */
export function parseMsapp(bytes: Uint8Array, source: MsappSource): PowerLensDocument {
  const document = createEmptyDocument({ ...source, detectedFormat: "msapp" });
  const diagnostics: Diagnostic[] = [];

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipNormalized(bytes);
  } catch (err) {
    diagnostics.push({
      code: "PL100",
      severity: "error",
      message: `Não foi possível abrir o arquivo como zip: ${String(err)}`,
    });
    document.diagnostics = diagnostics;
    return document;
  }

  const { screens, components } = parseSourceFiles(entries, diagnostics);
  const dataSources = parseDataSources(entries, diagnostics);
  const fallbackName = source.fileName.replace(/\.msapp$/i, "");
  const { id, name } = parseAppMetadata(entries, fallbackName, diagnostics);

  const controlNames = collectControlNames(screens, components);
  const screenNames = new Set(screens.map((screen) => screen.name));
  const dataSourceNames = new Set(dataSources.map((dataSource) => dataSource.name));
  const formulaBodies = collectFormulaBodies(screens, components);
  const variables = extractVariableUsages(formulaBodies);
  const variableNames = new Set(
    variables.filter((v) => v.kind === "variable" || v.kind === "contextVariable").map((v) => v.name),
  );
  const collectionNames = new Set(variables.filter((v) => v.kind === "collection").map((v) => v.name));

  finalizeReferences(screens, components, {
    controlNames,
    screenNames,
    dataSourceNames,
    variableNames,
    collectionNames,
  });

  const canvasApp: CanvasApp = {
    kind: "canvasApp",
    id,
    name,
    screens,
    components,
    dataSources,
    variables,
  };

  document.artifacts = [canvasApp];
  document.diagnostics = diagnostics;
  return document;
}
