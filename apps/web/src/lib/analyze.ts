import {
  createEmptyDocument,
  detectFormat,
  parseFlow,
  parseMsapp,
  parseSolution,
  type Diagnostic,
  type PowerLensDocument,
} from "@power-lens/core";

export type AnalysisResult =
  | { status: "unrecognized"; fileName: string; diagnostics: Diagnostic[] }
  | { status: "parsed"; document: PowerLensDocument };

/**
 * Bridges a dropped File to the core pipeline (detect -> parser). This is
 * the only place in apps/web allowed to touch file bytes/zip structure —
 * everything past this point works off PowerLensDocument.
 */
export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const detection = detectFormat(bytes, file.name);
  if (!detection.format) {
    return { status: "unrecognized", fileName: file.name, diagnostics: detection.diagnostics };
  }

  const source = { fileName: file.name, fileSize: file.size };

  if (detection.format === "msapp") {
    const document = parseMsapp(bytes, source);
    document.diagnostics = [...detection.diagnostics, ...document.diagnostics];
    return { status: "parsed", document };
  }

  if (detection.format === "solution") {
    const document = parseSolution(bytes, source);
    document.diagnostics = [...detection.diagnostics, ...document.diagnostics];
    return { status: "parsed", document };
  }

  if (detection.format === "flow") {
    const document = parseFlow(bytes, source);
    document.diagnostics = [...detection.diagnostics, ...document.diagnostics];
    return { status: "parsed", document };
  }

  const document = createEmptyDocument({ ...source, detectedFormat: detection.format });
  document.diagnostics = [
    ...detection.diagnostics,
    {
      code: "PL210",
      severity: "warning",
      message: `Formato "${detection.format}" detectado, mas o parser ainda não está implementado nesta fase.`,
    },
  ];
  return { status: "parsed", document };
}
