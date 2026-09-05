/**
 * Loose shapes for solution.xml. UNVERIFIED against a real solution.zip —
 * see docs/FORMAT-NOTES.md section 2. Modeled on the publicly documented
 * Dataverse ImportExportXml/SolutionManifest shape; the parser degrades to
 * a Diagnostic instead of throwing when this doesn't hold.
 */

export type RawLocalizedName = {
  "@_description"?: string;
  "@_languagecode"?: string;
};

export type RawLocalizedNames = {
  LocalizedName?: RawLocalizedName | RawLocalizedName[];
};

export type RawPublisher = {
  UniqueName?: string;
  LocalizedNames?: RawLocalizedNames;
};

export type RawSolutionManifest = {
  UniqueName?: string;
  LocalizedNames?: RawLocalizedNames;
  Version?: string;
  Publisher?: RawPublisher;
};

export type RawSolutionXml = {
  ImportExportXml?: {
    SolutionManifest?: RawSolutionManifest;
  };
};
