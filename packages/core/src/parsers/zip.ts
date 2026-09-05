import { unzipSync } from "fflate";

/**
 * Zip entry names inside a real .msapp may use "\" as a separator instead of
 * "/" (docs/FORMAT-NOTES.md section 3, item 11 — CMPA had to normalize this
 * everywhere it compared entry names).
 */
export function normalizeZipPath(path: string): string {
  return path.replace(/\\/g, "/");
}

export function unzipNormalized(bytes: Uint8Array): Record<string, Uint8Array> {
  const raw = unzipSync(bytes);
  const normalized: Record<string, Uint8Array> = {};
  for (const [path, data] of Object.entries(raw)) {
    normalized[normalizeZipPath(path)] = data;
  }
  return normalized;
}

const decoder = new TextDecoder("utf-8");

export function readText(entries: Record<string, Uint8Array>, path: string): string | undefined {
  const data = entries[path];
  return data ? decoder.decode(data) : undefined;
}
