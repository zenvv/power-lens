import type { Diagnostic, SourceFormat } from "../ir/index.js";
import { unzipNormalized } from "../parsers/zip.js";

export type DetectionResult =
  | { format: SourceFormat; diagnostics: Diagnostic[] }
  | { format: undefined; diagnostics: Diagnostic[] };

function looksLikeZip(bytes: Uint8Array): boolean {
  // Local file header "PK\x03\x04", or an empty-archive end-of-central-directory
  // record "PK\x05\x06" — both are valid magic bytes for a zip (spec section 4).
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05)
  );
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function looksLikeFlowDefinition(bytes: Uint8Array): boolean {
  try {
    const text = new TextDecoder("utf-8").decode(bytes);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if ("triggers" in parsed || "actions" in parsed) return true;
    const properties = parsed["properties"];
    return (
      typeof properties === "object" &&
      properties !== null &&
      "definition" in (properties as Record<string, unknown>)
    );
  } catch {
    return false;
  }
}

/**
 * Detects the artifact format from magic bytes + internal zip structure
 * (spec section 4). Never throws — an unrecognized file yields
 * `format: undefined` plus a diagnostic explaining what was checked.
 */
export function detectFormat(bytes: Uint8Array, fileName: string): DetectionResult {
  const ext = extensionOf(fileName);

  if (!looksLikeZip(bytes)) {
    if (looksLikeFlowDefinition(bytes)) {
      return { format: "flow", diagnostics: [] };
    }

    if (ext === ".pbip") {
      return {
        format: "pbip",
        diagnostics: [
          {
            code: "PL201",
            severity: "warning",
            message:
              "Arquivos .pbip são apenas um ponteiro; o projeto real está em pastas irmãs (Report/, SemanticModel/) que não foram enviadas.",
            hint: "Envie a pasta do projeto inteira, não só o arquivo .pbip.",
          },
        ],
      };
    }

    return {
      format: undefined,
      diagnostics: [
        {
          code: "PL200",
          severity: "error",
          message: "Formato não reconhecido: o arquivo não é um zip nem um JSON de definição de fluxo.",
        },
      ],
    };
  }

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipNormalized(bytes);
  } catch (err) {
    return {
      format: undefined,
      diagnostics: [
        {
          code: "PL202",
          severity: "error",
          message: `O arquivo tem assinatura de zip mas não pôde ser aberto: ${String(err)}`,
        },
      ],
    };
  }

  const names = new Set(Object.keys(entries));

  // Solution .zip: docs/FORMAT-NOTES.md section 2 flags this is unverified
  // against a real file — solution.xml at the root is the conventional
  // Dataverse solution manifest, kept as our best-effort signal.
  if (names.has("solution.xml") || names.has("customizations.xml")) {
    return { format: "solution", diagnostics: [] };
  }

  const hasSrcYaml = [...names].some((name) => /^Src\/.*\.pa\.yaml$/i.test(name));
  if (hasSrcYaml || (names.has("Properties.json") && names.has("References/DataSources.json"))) {
    return { format: "msapp", diagnostics: [] };
  }

  // Studio's actual export is an outer wrapper zip around the real .msapp —
  // docs/FORMAT-NOTES.md section 1.1. Recognize it by the presence of any
  // *.msapp entry; parseMsapp() does the actual unwrapping.
  if ([...names].some((name) => /\.msapp$/i.test(name))) {
    return { format: "msapp", diagnostics: [] };
  }

  const hasDataModelSchema = names.has("DataModelSchema");
  const hasDataModel = names.has("DataModel");
  if (hasDataModelSchema && !hasDataModel) {
    return { format: "pbit", diagnostics: [] };
  }
  if (hasDataModel) {
    return { format: "pbix", diagnostics: [] };
  }

  // Fall back to the file extension when internal structure didn't match any
  // known signature — degrades honestly with a low-confidence note instead
  // of refusing outright.
  if (ext === ".msapp" || ext === ".pbit" || ext === ".pbix") {
    const format: SourceFormat = ext === ".msapp" ? "msapp" : ext === ".pbit" ? "pbit" : "pbix";
    return {
      format,
      diagnostics: [
        {
          code: "PL203",
          severity: "info",
          message: `Formato assumido pela extensão "${ext}" — a estrutura interna do zip não bateu com nenhuma assinatura conhecida.`,
        },
      ],
    };
  }

  return {
    format: undefined,
    diagnostics: [
      {
        code: "PL200",
        severity: "error",
        message: "Formato não reconhecido: é um zip, mas sem solution.xml, Src/*.pa.yaml, DataModelSchema ou DataModel.",
      },
    ],
  };
}
