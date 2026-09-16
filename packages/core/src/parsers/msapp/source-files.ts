import { parse as parseYaml } from "yaml";
import type { Component, Diagnostic, Expression, Screen } from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";
import { mapExpression, mapRoot } from "./controls.js";
import type { RawAppFile, RawComponentFile, RawScreenFile } from "./raw-shapes.js";
import { readText } from "../zip.js";

/**
 * Confirmed empirically (docs/FORMAT-NOTES.md section 1.3): exactly one
 * screen, or one component, per Src/*.pa.yaml file. Src/App.pa.yaml (root
 * key "App") carries the app-level OnStart, extracted below — everything
 * else in it (Theme, other app-level properties) and
 * Src/_EditorState.pa.yaml still have nowhere to go in the current
 * CanvasApp IR shape — see FORMAT-NOTES section 5.
 */
export function parseSourceFiles(
  entries: Record<string, Uint8Array>,
  diagnostics: Diagnostic[],
  locale: Locale = DEFAULT_LOCALE,
): { screens: Screen[]; components: Component[]; appOnStart?: Expression | undefined } {
  const messages = getMessages(locale).parsers.msapp;
  const srcPaths = Object.keys(entries)
    .filter((path) => /^Src\/.*\.pa\.yaml$/i.test(path))
    .sort();

  const screens: Screen[] = [];
  const components: Component[] = [];
  let screenOrder = 0;
  let appOnStart: Expression | undefined;

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
        message: messages.yamlParseError({ error: String(err) }),
        path,
      });
      continue;
    }

    if (!parsed || typeof parsed !== "object") {
      continue;
    }

    const record = parsed as RawScreenFile & RawComponentFile & RawAppFile;

    if (record.App) {
      const onStartValue = record.App.Properties?.OnStart;
      if (onStartValue !== undefined) {
        appOnStart = mapExpression(onStartValue);
      }
      continue;
    }

    if (record.Screens) {
      for (const [screenName, def] of Object.entries(record.Screens)) {
        screens.push({
          name: screenName,
          order: screenOrder++,
          root: mapRoot(screenName, "Screen", def ?? {}, diagnostics, locale),
        });
      }
      continue;
    }

    if (record.ComponentDefinitions) {
      for (const [componentName, def] of Object.entries(record.ComponentDefinitions)) {
        components.push({
          name: componentName,
          root: mapRoot(componentName, "Component", def ?? {}, diagnostics, locale),
        });
      }
      continue;
    }
  }

  if (screens.length > 1) {
    diagnostics.push({
      code: "PL105",
      severity: "info",
      message: messages.screenOrderInferred.message,
      hint: messages.screenOrderInferred.hint,
    });
  }

  return { screens, components, appOnStart };
}
