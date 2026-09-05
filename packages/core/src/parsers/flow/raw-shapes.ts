/**
 * Loose shapes for a Cloud Flow's definition.json, before mapping into the
 * IR. This follows the publicly documented Azure Logic Apps Workflow
 * Definition Language schema, which Power Automate reuses — but it has
 * NOT been verified against a real definition.json from this project's own
 * files (docs/FORMAT-NOTES.md section 4: CMPA never opened one either, only
 * confirmed the file's path convention). The parser degrades to a
 * Diagnostic instead of throwing when this doesn't hold.
 */

export type RawRunAfter = Record<string, string[]>;

export type RawActionHost = {
  apiId?: string;
  connectionName?: string;
};

export type RawActionInputs = {
  host?: RawActionHost;
};

export type RawAction = {
  type?: string;
  description?: string;
  inputs?: RawActionInputs | unknown;
  runAfter?: RawRunAfter;
  actions?: Record<string, RawAction>;
  else?: { actions?: Record<string, RawAction> };
  cases?: Record<string, { actions?: Record<string, RawAction> }>;
  default?: { actions?: Record<string, RawAction> };
};

export type RawTrigger = {
  type?: string;
  inputs?: RawActionInputs | unknown;
};

export type RawWorkflowDefinition = {
  triggers?: Record<string, RawTrigger>;
  actions?: Record<string, RawAction>;
};

/**
 * Some export paths wrap the workflow definition under `properties` (a
 * "flow package" shape) instead of putting triggers/actions at the top
 * level — also unverified, kept as a fallback shape the parser tries.
 */
export type RawFlowPackage = {
  properties?: {
    displayName?: string;
    definition?: RawWorkflowDefinition;
    connectionReferences?: Record<string, { api?: { name?: string }; displayName?: string }>;
  };
};
