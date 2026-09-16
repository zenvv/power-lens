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
  /**
   * [LACUNA] Presente numa ação "Executar um Fluxo Filho"/"Run a Child
   * Flow" (`type: "Workflow"`), segundo o schema publicamente documentado
   * do Workflow Definition Language — nunca visto num definition.json real
   * deste projeto. `id` é o identificador do fluxo filho (geralmente um
   * path terminando no GUID interno dele), não o nome de exibição.
   */
  workflow?: { id?: string };
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
  /**
   * [LACUNA] Presente numa action `type: "If"`, segundo o schema publicamente
   * documentado do Workflow Definition Language — nunca visto num
   * definition.json real deste projeto. Ora um objeto em árvore de operador
   * (`{"and": [{"equals": [a, b]}]}`), ora uma string de expressão crua
   * (`"@equals(a, b)"`). `stringifyCondition` (condition.ts) trata os dois.
   */
  expression?: unknown;
  /**
   * [LACUNA] Presente numa action `type: "Foreach"` — a expressão (sempre
   * string, segundo a doc pública) que resolve pro array iterado. Não existe
   * campo de "nome da variável de iteração": o item corrente é referenciado
   * dentro do loop via `items('<nome-da-action>')`, implícito pelo próprio
   * nome da action.
   */
  foreach?: string;
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
