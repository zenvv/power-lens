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

/**
 * Loose shapes for customizations.xml (tabelas Dataverse). Diferente de
 * solution.xml, este schema É verificado: baixado o Schemas.zip oficial da
 * Microsoft (CustomizationsSolution.xsd) e lido diretamente — ver
 * docs/FORMAT-NOTES.md seção 2.1. `fast-xml-parser` colapsa um elemento
 * repetível pra objeto único quando só há 1 ocorrência; `normalizeArray` no
 * parser trata os dois casos.
 */

export type RawAttribute = {
  "@_PhysicalName"?: string;
  Type?: string;
  LogicalName?: string;
  CalculationOf?: string;
  FormulaDefinitionFileName?: string;
};

export type RawEntityInfoEntity = {
  attributes?: {
    attribute?: RawAttribute | RawAttribute[];
  };
};

export type RawEntity = {
  "@_Name"?: string;
  EntityInfo?: {
    entity?: RawEntityInfoEntity;
  };
};

export type RawEntities = {
  Entity?: RawEntity | RawEntity[];
};

export type RawEntityRelationship = {
  "@_Name"?: string;
  EntityRelationshipType?: string;
  ReferencingEntityName?: string;
  ReferencedEntityName?: string;
  ReferencingAttributeName?: string;
  FirstEntityName?: string;
  SecondEntityName?: string;
  IntersectEntityName?: string;
};

export type RawEntityRelationships = {
  EntityRelationship?: RawEntityRelationship | RawEntityRelationship[];
};

export type RawCustomizationsXml = {
  ImportExportXml?: {
    Entities?: RawEntities;
    EntityRelationships?: RawEntityRelationships;
  };
};
