import {
  createEmptyDocument,
  detectFormat,
  parseFlow,
  parseMsapp,
  parsePbit,
  parseSolution,
  runHealthChecks,
  DEFAULT_LOCALE,
  type Diagnostic,
  type Locale,
  type PowerLensDocument,
} from "@power-lens/core";
import { en } from "./i18n/translations/en";
import { pt } from "./i18n/translations/pt";
import { es } from "./i18n/translations/es";

export type AnalysisResult =
  | { status: "unrecognized"; fileName: string; diagnostics: Diagnostic[] }
  | { status: "parsed"; document: PowerLensDocument };

const ANALYZE_MESSAGES: Record<Locale, (typeof en)["analyze"]> = {
  en: en.analyze,
  pt: pt.analyze,
  es: es.analyze,
};

type AnalyzeOptions = {
  /** Rótulo da etapa real do pipeline em andamento — usado pela UI de
   * loading pra mostrar o que está acontecendo, não um progresso fabricado. */
  onStage?: (label: string) => void;
  locale?: Locale;
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
  const { onStage, locale = DEFAULT_LOCALE } = options;
  const messages = ANALYZE_MESSAGES[locale];
  onStage?.(messages.stageDetecting);
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const detection = detectFormat(bytes, file.name, locale);
  if (!detection.format) {
    return { status: "unrecognized", fileName: file.name, diagnostics: detection.diagnostics };
  }

  const formatLabel: Record<string, string> = messages.formatLabel;
  onStage?.(messages.stageReadingStructure({ formatLabel: formatLabel[detection.format] ?? detection.format }));
  const source = { fileName: file.name, fileSize: file.size };

  let document: PowerLensDocument;
  switch (detection.format) {
    case "msapp":
      document = parseMsapp(bytes, source, locale);
      break;
    case "solution":
      document = parseSolution(bytes, source, locale);
      break;
    case "flow":
      document = parseFlow(bytes, source, locale);
      break;
    case "pbit":
      document = parsePbit(bytes, source, locale);
      break;
    default:
      document = createEmptyDocument({ ...source, detectedFormat: detection.format });
      document.diagnostics = [
        {
          code: "PL210",
          severity: "warning",
          message: messages.parserNotImplemented({ format: detection.format }),
        },
      ];
  }

  onStage?.(messages.stageVerifyingIntegrity);
  document.diagnostics = [...detection.diagnostics, ...document.diagnostics, ...runHealthChecks(document, undefined, locale)];
  return { status: "parsed", document };
}
