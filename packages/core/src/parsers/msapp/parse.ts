import { createEmptyDocument, type CanvasApp, type Diagnostic, type PowerLensDocument } from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";
import { parseAppMetadata } from "./app-metadata.js";
import { parseDataSources } from "./data-sources.js";
import { extractReferences, extractVariableUsages } from "./references.js";
import { parseSourceFiles } from "./source-files.js";
import { collectControlNames, collectFormulaBodies, finalizeReferences } from "./walk.js";
import { findInnerMsappEntry, hasDirectMsappShape, unzipNormalized } from "../zip.js";

export type MsappSource = {
  fileName: string;
  fileSize: number;
};

/**
 * Parses a .msapp (new Src/*.pa.yaml format) into a PowerLensDocument.
 * Never throws for malformed input — every failure degrades to a Diagnostic
 * on the returned document (spec principle: "degradação honesta").
 */
export function parseMsapp(bytes: Uint8Array, source: MsappSource, locale: Locale = DEFAULT_LOCALE): PowerLensDocument {
  const messages = getMessages(locale).parsers.msapp;
  const document = createEmptyDocument({ ...source, detectedFormat: "msapp" });
  const diagnostics: Diagnostic[] = [];

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipNormalized(bytes);
  } catch (err) {
    diagnostics.push({
      code: "PL100",
      severity: "error",
      message: messages.cantOpenZip({ error: String(err) }),
    });
    document.diagnostics = diagnostics;
    return document;
  }

  // Studio's real export is an outer wrapper zip (Microsoft.Flow/ +
  // Microsoft.PowerApps/apps/<id>/<guid>-document.msapp), not the .msapp
  // itself — docs/FORMAT-NOTES.md section 1.1. Unwrap it transparently.
  if (!hasDirectMsappShape(entries)) {
    const outerEntries = entries;
    const inner = findInnerMsappEntry(outerEntries);

    if (inner.kind === "found") {
      const innerBytes = outerEntries[inner.path];
      try {
        if (!innerBytes) throw new Error("empty entry");
        entries = unzipNormalized(innerBytes);
        diagnostics.push({
          code: "PL109",
          severity: "info",
          message: messages.extractedFromPackage({ path: inner.path }),
        });
      } catch (err) {
        diagnostics.push({
          code: "PL111",
          severity: "error",
          message: messages.cantOpenExtracted({ path: inner.path, error: String(err) }),
        });
      }
    } else if (inner.kind === "ambiguous") {
      diagnostics.push({
        code: "PL110",
        severity: "error",
        message: messages.multipleMsappFound({ paths: inner.paths.join(", ") }),
      });
    }

    const flowFolderPaths = Object.keys(outerEntries).filter((path) => /^Microsoft\.Flow\//i.test(path));
    if (flowFolderPaths.length > 0) {
      diagnostics.push({
        code: "PL112",
        severity: "info",
        message: messages.flowFolderFound({ count: flowFolderPaths.length }),
      });
    }
  }

  const { screens, components, appOnStart } = parseSourceFiles(entries, diagnostics, locale);
  const dataSources = parseDataSources(entries, diagnostics, locale);
  const fallbackName = source.fileName.replace(/\.msapp$/i, "");
  const { id, name } = parseAppMetadata(entries, fallbackName, diagnostics, locale);

  const controlNames = collectControlNames(screens, components);
  const screenNames = new Set(screens.map((screen) => screen.name));
  const dataSourceNames = new Set(dataSources.map((dataSource) => dataSource.name));
  const formulaBodies = collectFormulaBodies(screens, components);
  if (appOnStart?.kind === "formula") {
    formulaBodies.push(appOnStart.raw.slice(1));
  }
  const variables = extractVariableUsages(formulaBodies);
  const variableNames = new Set(
    variables.filter((v) => v.kind === "variable" || v.kind === "contextVariable").map((v) => v.name),
  );
  const collectionNames = new Set(variables.filter((v) => v.kind === "collection").map((v) => v.name));

  const referenceContext = {
    controlNames,
    screenNames,
    dataSourceNames,
    variableNames,
    collectionNames,
  };

  finalizeReferences(screens, components, referenceContext);
  if (appOnStart?.kind === "formula") {
    appOnStart.references = extractReferences(appOnStart.raw.slice(1), referenceContext);
  }

  const canvasApp: CanvasApp = {
    kind: "canvasApp",
    id,
    name,
    screens,
    components,
    dataSources,
    variables,
    ...(appOnStart ? { onStart: appOnStart } : {}),
  };

  document.artifacts = [canvasApp];
  document.diagnostics = diagnostics;
  return document;
}
