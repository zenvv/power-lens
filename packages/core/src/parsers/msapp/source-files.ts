import { parse as parseYaml } from "yaml";
import type { Component, Diagnostic, Screen } from "../../ir/index.js";
import { mapRoot } from "./controls.js";
import type { RawComponentFile, RawScreenFile } from "./raw-shapes.js";
import { readText } from "../zip.js";

/**
 * Confirmed empirically (docs/FORMAT-NOTES.md section 1.3): exactly one
 * screen, or one component, per Src/*.pa.yaml file. Src/App.pa.yaml (root
 * key "App") and Src/_EditorState.pa.yaml carry nothing representable in
 * the current CanvasApp IR shape — see FORMAT-NOTES section 5.
 */
export function parseSourceFiles(
  entries: Record<string, Uint8Array>,
  diagnostics: Diagnostic[],
): { screens: Screen[]; components: Component[] } {
  const srcPaths = Object.keys(entries)
    .filter((path) => /^Src\/.*\.pa\.yaml$/i.test(path))
    .sort();

  const screens: Screen[] = [];
  const components: Component[] = [];
  let screenOrder = 0;

  for (const path of srcPaths) {
    const text = readText(entries, path);
    if (text === undefined) continue;

    let parsed: unknown;
    try {
      parsed = parseYaml(text);
    } catch (err) {
      diagnostics.push({
        code: "PL103",
        severity: "error",
        message: `Falha ao interpretar YAML: ${String(err)}`,
        path,
      });
      continue;
    }

    if (!parsed || typeof parsed !== "object") {
      continue;
    }

    const record = parsed as RawScreenFile & RawComponentFile;

    if (record.Screens) {
      for (const [screenName, def] of Object.entries(record.Screens)) {
        screens.push({
          name: screenName,
          order: screenOrder++,
          root: mapRoot(screenName, "Screen", def ?? {}, diagnostics),
        });
      }
      continue;
    }

    if (record.ComponentDefinitions) {
      for (const [componentName, def] of Object.entries(record.ComponentDefinitions)) {
        components.push({
          name: componentName,
          root: mapRoot(componentName, "Component", def ?? {}, diagnostics),
        });
      }
      continue;
    }
  }

  if (screens.length > 1) {
    diagnostics.push({
      code: "PL105",
      severity: "info",
      message:
        "A ordem das telas foi inferida pela ordem alfabética dos arquivos Src/*.pa.yaml, não por uma fonte autoritativa do Studio.",
      hint: "Ver docs/FORMAT-NOTES.md — ordem real de telas é uma lacuna conhecida.",
    });
  }

  return { screens, components };
}
