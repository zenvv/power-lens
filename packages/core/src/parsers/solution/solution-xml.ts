import { XMLParser } from "fast-xml-parser";
import type { Diagnostic } from "../../ir/index.js";
import { DEFAULT_LOCALE, getMessages, type Locale } from "../../i18n/index.js";
import type { RawLocalizedName, RawLocalizedNames, RawSolutionXml } from "./raw-shapes.js";

export type SolutionManifestInfo = {
  uniqueName: string;
  displayName: string;
  version?: string | undefined;
  publisherUniqueName?: string | undefined;
  publisherDisplayName?: string | undefined;
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function extractLocalizedName(localizedNames: RawLocalizedNames | undefined): string | undefined {
  const entry = localizedNames?.LocalizedName;
  const first: RawLocalizedName | undefined = Array.isArray(entry) ? entry[0] : entry;
  return first?.["@_description"];
}

/**
 * solution.xml's schema is unverified against a real file — see
 * docs/FORMAT-NOTES.md section 2. Follows the publicly documented Dataverse
 * ImportExportXml/SolutionManifest shape, defensively; anything that doesn't
 * match degrades to a Diagnostic instead of throwing.
 */
export function parseSolutionXml(
  text: string,
  diagnostics: Diagnostic[],
  locale: Locale = DEFAULT_LOCALE,
): SolutionManifestInfo | undefined {
  const messages = getMessages(locale).parsers.solution;
  let parsed: RawSolutionXml;
  try {
    parsed = parser.parse(text) as RawSolutionXml;
  } catch (err) {
    diagnostics.push({
      code: "PL301",
      severity: "error",
      message: messages.solutionXmlInvalid({ error: String(err) }),
      path: "solution.xml",
    });
    return undefined;
  }

  const manifest = parsed.ImportExportXml?.SolutionManifest;
  if (!manifest) {
    diagnostics.push({
      code: "PL302",
      severity: "warning",
      message: messages.solutionXmlUnexpectedShape.message,
      path: "solution.xml",
      hint: messages.solutionXmlUnexpectedShape.hint,
    });
    return undefined;
  }

  const uniqueName = manifest.UniqueName;
  if (!uniqueName) {
    diagnostics.push({
      code: "PL303",
      severity: "warning",
      message: messages.solutionXmlNoUniqueName,
      path: "solution.xml",
    });
  }

  return {
    uniqueName: uniqueName ?? "unknown-solution",
    displayName: extractLocalizedName(manifest.LocalizedNames) ?? uniqueName ?? messages.unknownSolutionName,
    version: manifest.Version,
    publisherUniqueName: manifest.Publisher?.UniqueName,
    publisherDisplayName: extractLocalizedName(manifest.Publisher?.LocalizedNames),
  };
}
