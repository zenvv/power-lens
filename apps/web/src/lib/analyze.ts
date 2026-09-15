import {
  createEmptyDocument,
  detectFormat,
  parseFlow,
  parseMsapp,
  parsePbit,
  parseSolution,
  runHealthChecks,
  type Diagnostic,
  type PowerLensDocument,
} from "@power-lens/core";

export type AnalysisResult =
  | { status: "unrecognized"; fileName: string; diagnostics: Diagnostic[] }
  | { status: "parsed"; document: PowerLensDocument };

/**
 * Bridges a dropped File to the core pipeline (detect -> parser -> health
 * check). This is the only place in apps/web allowed to touch file
 * bytes/zip structure — everything past this point works off
 * PowerLensDocument. Health checks run here (not inside each parser) so
 * they see the final, fully-assembled document regardless of which parser
 * produced it (spec seção 7: as regras são funções puras sobre o IR).
 */
export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const detection = detectFormat(bytes, file.name);
  if (!detection.format) {
    return { status: "unrecognized", fileName: file.name, diagnostics: detection.diagnostics };
  }

  const source = { fileName: file.name, fileSize: file.size };

  let document: PowerLensDocument;
  switch (detection.format) {
    case "msapp":
      document = parseMsapp(bytes, source);
      break;
    case "solution":
      document = parseSolution(bytes, source);
      break;
    case "flow":
      document = parseFlow(bytes, source);
      break;
    case "pbit":
      document = parsePbit(bytes, source);
      break;
    default:
      document = createEmptyDocument({ ...source, detectedFormat: detection.format });
      document.diagnostics = [
        {
          code: "PL210",
          severity: "warning",
          message: `Formato "${detection.format}" detectado, mas o parser ainda não está implementado nesta fase.`,
        },
      ];
  }

  document.diagnostics = [...detection.diagnostics, ...document.diagnostics, ...runHealthChecks(document)];
  return { status: "parsed", document };
}
