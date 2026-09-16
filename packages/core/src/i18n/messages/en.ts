/**
 * Dicionário fonte da verdade (inglês, `DEFAULT_LOCALE`) — a shape deste
 * objeto (`typeof en`) é o contrato que `pt.ts`/`es.ts` implementam via
 * `satisfies`. Toda entrada que interpola dado dinâmico (nome de tela,
 * contagem, etc.) é função, não string — texto fixo fica como string simples.
 */
export const en = {
  rules: {
    pl001: {
      label: "Orphan screen",
      message: (p: { screenName: string }) =>
        `Screen "${p.screenName}" isn't referenced by any navigation found in the app.`,
      hint: "Reference extraction is shallow (regex, not a full Power Fx parser) — confirm before removing the screen, there may be a Navigate(...) in an expression the analysis didn't capture.",
    },
    pl002: {
      label: "Control with default name",
      message: (p: { controlName: string }) =>
        `Control "${p.controlName}" still has the Studio's default name, never renamed.`,
      hint: "Descriptive names make it easier to understand formulas that reference the control later.",
    },
    pl003: {
      label: "Data source never referenced",
      message: (p: { dataSourceName: string }) =>
        `Data source "${p.dataSourceName}" is declared but wasn't found in any formula in the app.`,
      hint: "Reference extraction is shallow — confirm before removing the connection, it might be used only inside a component or by an expression the analysis didn't capture.",
    },
    pl004: {
      label: "Hardcoded GUID in formula",
      message: (p: { count: number; propertyName: string }) =>
        p.count > 1
          ? `${p.count} hardcoded GUIDs found in "${p.propertyName}".`
          : `Hardcoded GUID found in "${p.propertyName}".`,
      hint: "List/table/environment GUIDs pasted directly into the formula don't survive a move between environments.",
    },
    pl005: {
      label: "App.OnStart too long",
      optionLabel: "Max lines",
      message: (p: { lineCount: number; maxLines: number }) =>
        `App.OnStart has ${p.lineCount} lines (above the threshold of ${p.maxLines}).`,
      hint: "Consider breaking it into reusable components or moving part of the logic into named functions.",
    },
    pl006: {
      label: "Duplicate formula across controls",
      optionLabel: "Minimum occurrences",
      message: (p: { preview: string; count: number }) =>
        `Formula ${p.preview} repeats across ${p.count} different controls.`,
      hint: (p: { controls: string[] }) => `Controls: ${p.controls.join(", ")}`,
    },
    pl007: {
      label: "Empty accessibility property",
      message: (p: { controlName: string; controlType: string }) =>
        `Control "${p.controlName}" (${p.controlType}) has no AccessibleLabel — a screen reader can't describe it.`,
      hint: "Set AccessibleLabel to a short text describing the control's action/content.",
    },
    pl008: {
      label: "Function without delegation over remote data",
      message: (p: { functions: string; dataSources: string; propertyName: string }) =>
        `${p.functions} over ${p.dataSources} in "${p.propertyName}" — never delegates; only the first page of the remote source is processed.`,
      hint: "Consider replacing it with Filter/Sort (delegable, depending on the connector) before iterating over the result.",
    },
    pl009: {
      label: "Premium connector in use",
      message: (p: { dataSourceName: string; connectorId: string }) =>
        `Data source "${p.dataSourceName}" uses the "${p.connectorId}" connector, which is premium.`,
      hint: "Confirm every user of the app has the license required (Power Apps per-app/per-user or equivalent) for this connector.",
    },
    pl010: {
      label: "Inactive relationship",
      message: (p: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }) =>
        `Relationship ${p.fromTable}.${p.fromColumn} → ${p.toTable}.${p.toColumn} is inactive.`,
      hint: "Only applied explicitly via USERELATIONSHIP in a DAX measure — confirm this is intentional.",
    },
    pl011: {
      label: "Critical action without failure handling",
      message: (p: { actionName: string; connectorOrType: string }) =>
        `Action "${p.actionName}" (${p.connectorOrType}) has no step handling its failure.`,
      hint: 'Add a step with "Configure run after" (runAfter Failed/TimedOut) for this action, or confirm a silent failure here is acceptable.',
    },
    pl012: {
      label: "Nested Foreach",
      message: (p: { nodeName: string }) => `"${p.nodeName}" is a Foreach nested inside another Foreach.`,
      hint: "A nested Foreach is inherently sequential and scales poorly — consider flattening the list with Select/Filter array before a single loop.",
    },
    pl013: {
      label: "Model table/column never referenced",
      messageTable: (p: { tableName: string }) =>
        `Table "${p.tableName}" doesn't appear in any relationship or formula found in the model.`,
      hintTable:
        "The search is textual, not a full DAX/M parser — confirm before removing it, it might be used in a way the analysis didn't capture.",
      messageColumn: (p: { tableName: string; columnName: string }) =>
        `Column "${p.tableName}.${p.columnName}" doesn't appear in any relationship or formula found in the model.`,
      hintColumn:
        "The search is textual, not a full DAX/M parser — confirm before removing it, it might be used only in a report visual.",
    },
    pl014: {
      label: "Relationship with risky shape",
      message: (p: { fromTable: string; fromColumn: string; toTable: string; toColumn: string; reasons: string }) =>
        `Relationship ${p.fromTable}.${p.fromColumn} → ${p.toTable}.${p.toColumn} has a risky shape: ${p.reasons}.`,
      reasons: {
        bidirectional: "bidirectional cross-filter",
        manyToMany: "many-to-many cardinality",
      },
      hint: "Confirm this is intentional — bidirectional filtering and many-to-many are common sources of wrong results in DAX measures.",
    },
    pl015: {
      label: "Text/background contrast below recommended",
      message: (p: { ratio: string; path: string }) =>
        `Contrast of ${p.ratio}:1 between text and background in "${p.path}", below the recommended minimum (4.5:1).`,
      hint: "Only calculated when Fill/Color resolve to a fully opaque color (literal or constant RGBA) — large text has a lower threshold (3:1), not distinguished here.",
    },
  },
};
