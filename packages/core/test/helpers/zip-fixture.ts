import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { zipSync, type Zippable } from "fflate";

/**
 * Test-only helper: zips a fixture directory (e.g. fixtures/synthetic/msapp-minimal/)
 * into an in-memory .msapp-shaped buffer so parser tests don't need to commit a
 * binary zip file — the fixture stays plain text and diffable in git.
 */
export function zipFixtureDir(dirPath: string): Uint8Array {
  const entries: Zippable = {};

  function walk(current: string) {
    for (const name of readdirSync(current)) {
      const fullPath = join(current, name);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }
      const zipPath = relative(dirPath, fullPath).split(sep).join("/");
      entries[zipPath] = readFileSync(fullPath);
    }
  }

  walk(dirPath);
  return zipSync(entries);
}
