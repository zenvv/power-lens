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

const FORMAT_LABEL: Record<string, string> = {
  msapp: "app canvas (.msapp)",
  solution: "solution (.zip)",
  flow: "definição de flow",
  pbit: ".pbit/.pbip",
};

type AnalyzeOptions = {
  /** Rótulo da etapa real do pipeline em andamento — usado pela UI de
   * loading pra mostrar o que está acontecendo, não um progresso fabricado. */
  onStage?: (label: string) => void;
};

/**
 * Bridges a dropped File to the core pipeline (detect -> parser -> health
 * check). This is the only place in apps/web allowed to touch file
 * bytes/zip structure — everything past this point works off
 * PowerLensDocument. Health checks run here (not inside each parser) so
 * they see the final, fully-assembled document regardless of which parser
 * produced it (spec seção 7: as regras são funções puras sobre o IR).
 */
export async function analyzeFile(file: File, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const { onStage } = options;
  onStage?.("Detectando formato do arquivo");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const detection = detectFormat(bytes, file.name);
  if (!detection.format) {
    return { status: "unrecognized", fileName: file.name, diagnostics: detection.diagnostics };
  }

  onStage?.(`Lendo estrutura do ${FORMAT_LABEL[detection.format] ?? detection.format}`);
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

  onStage?.("Verificando integridade");
  document.diagnostics = [...detection.diagnostics, ...document.diagnostics, ...runHealthChecks(document)];
  return { status: "parsed", document };
}
