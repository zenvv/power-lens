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

export function hasDirectMsappShape(entries: Record<string, Uint8Array>): boolean {
  return (
    Object.keys(entries).some((path) => /^Src\/.*\.pa\.yaml$/i.test(path)) ||
    (entries["Properties.json"] !== undefined && entries["References/DataSources.json"] !== undefined)
  );
}

export type InnerMsappLookup =
  | { kind: "found"; path: string }
  | { kind: "none" }
  | { kind: "ambiguous"; paths: string[] };

/**
 * A real Power Apps Studio export is an outer wrapper zip (Microsoft.Flow/ +
 * Microsoft.PowerApps/apps/<id>/<guid>-document.msapp), not the .msapp
 * itself — docs/FORMAT-NOTES.md section 1.1. CMPA locates the inner .msapp
 * by suffix-matching "*.msapp" across the whole archive and requiring
 * exactly one match, regardless of the numeric app-id folder name; this
 * mirrors that.
 */
export function findInnerMsappEntry(entries: Record<string, Uint8Array>): InnerMsappLookup {
  const matches = Object.keys(entries).filter((path) => /\.msapp$/i.test(path));
  if (matches.length === 0) return { kind: "none" };
  if (matches.length > 1) return { kind: "ambiguous", paths: matches };
  return { kind: "found", path: matches[0]! };
}
