import { CORE_VERSION } from "../version.js";
import {
  PowerLensDocumentSchema,
  SCHEMA_VERSION,
  type PowerLensDocument,
  type SourceFormat,
} from "./schema.js";

export type NewSource = {
  fileName: string;
  fileSize: number;
  detectedFormat: SourceFormat;
};

export function createEmptyDocument(source: NewSource): PowerLensDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    source: {
      ...source,
      parsedAt: new Date().toISOString(),
      parserVersion: CORE_VERSION,
    },
    artifacts: [],
    diagnostics: [],
  };
}

export type ValidationResult =
  | { ok: true; document: PowerLensDocument }
  | { ok: false; message: string; issues: readonly { path: string; message: string }[] };

export function validateDocument(input: unknown): ValidationResult {
  const result = PowerLensDocumentSchema.safeParse(input);
  if (result.success) {
    return { ok: true, document: result.data };
  }

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return {
    ok: false,
    message: issues.map((issue) => `${issue.path || "(root)"}: ${issue.message}`).join("; "),
    issues,
  };
}
