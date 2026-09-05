/**
 * Loose shapes for the raw YAML/JSON as they come out of Src/*.pa.yaml,
 * before mapping into the IR. Not zod-validated — the parser degrades to a
 * Diagnostic instead of throwing when these shapes don't hold (spec
 * principle: "degradação honesta").
 */

export type RawControlNode = {
  Control?: string;
  ComponentName?: string;
  Variant?: string;
  Properties?: Record<string, unknown>;
  Children?: unknown[];
};

export type RawScreenOrComponentDef = {
  Properties?: Record<string, unknown>;
  Children?: unknown[];
};

export type RawScreenFile = {
  Screens?: Record<string, RawScreenOrComponentDef>;
};

export type RawComponentFile = {
  ComponentDefinitions?: Record<string, RawScreenOrComponentDef>;
};

export type RawAppFile = {
  App?: {
    Properties?: Record<string, unknown>;
  };
};

export type RawDataSourceEntry = {
  Name?: string;
  Type?: string;
  ApiId?: string;
};

export type RawDataSourcesFile = {
  DataSources?: RawDataSourceEntry[];
};

export type RawPropertiesFile = {
  Id?: string;
  Name?: string;
};
