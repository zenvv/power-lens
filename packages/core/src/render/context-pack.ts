import { zipSync } from "fflate";
import type { PowerLensDocument } from "../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../i18n/index.js";
import { renderMarkdown } from "./markdown/index.js";

const encoder = new TextEncoder();

/**
 * Exportado (não só usado internamente por `buildContextPack`) pra o BYOK
 * (spec seção 9) reusar exatamente as mesmas instruções — a chamada
 * automática ao provedor é só a versão automatizada de "cole PROMPT.md e
 * ir.json num LLM".
 */
export function buildPromptMd(document: PowerLensDocument, locale: Locale = DEFAULT_LOCALE): string {
  return getMessages(locale).contextPack.promptMd({
    fileName: document.source.fileName,
    format: document.source.detectedFormat,
  });
}

function buildReadme(document: PowerLensDocument, locale: Locale = DEFAULT_LOCALE): string {
  const messages = getMessages(locale).contextPack;
  const title = messages.readmeTitle;
  const body = messages.readmeBody({
    fileName: document.source.fileName,
    format: document.source.detectedFormat,
    parsedAt: document.source.parsedAt,
  });
  return `${title}\n${"=".repeat(title.length)}\n\n${body}`;
}

/**
 * Builds the downloadable context pack (spec section 9): ir.json + the same
 * deterministic Markdown doc export + a ready-to-paste prompt + a plain-text
 * README. Deliberately does not prune the IR for very large artifacts yet
 * (spec mentions a future `toPromptPayload(doc, { maxDepth, includeExpressions })`)
 * — out of scope for Fase 1.
 */
export function buildContextPack(document: PowerLensDocument, locale: Locale = DEFAULT_LOCALE): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "power-lens-pack/ir.json": encoder.encode(JSON.stringify(document, null, 2)),
    "power-lens-pack/summary.md": encoder.encode(renderMarkdown(document, locale)),
    "power-lens-pack/PROMPT.md": encoder.encode(buildPromptMd(document, locale)),
    "power-lens-pack/README.txt": encoder.encode(buildReadme(document, locale)),
  };
  return zipSync(files);
}
