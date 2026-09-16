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
  parsers: {
    common: {
      noName: "(no name)",
      unknown: "(unknown)",
      missing: "(missing)",
    },
    detect: {
      pbipPointerOnly: {
        message:
          "The .pbip file is just a pointer; the actual project lives in sibling folders (Report/, SemanticModel/) that weren't included.",
        hint: "Upload the whole project folder, not just the .pbip file.",
      },
      notZipOrFlow: "Unrecognized format: the file is neither a zip nor a flow definition JSON.",
      zipCantOpen: (p: { error: string }) => `The file has a zip signature but couldn't be opened: ${p.error}`,
      zipNoSignature:
        "Unrecognized format: it's a zip, but without solution.xml, Src/*.pa.yaml, DataModelSchema, or DataModel.",
      extensionFallback: (p: { ext: string }) =>
        `Format assumed from the "${p.ext}" extension — the zip's internal structure didn't match any known signature.`,
    },
    msapp: {
      cantOpenZip: (p: { error: string }) => `Couldn't open the file as a zip: ${p.error}`,
      extractedFromPackage: (p: { path: string }) =>
        `The file was a Power Apps Studio export package; the .msapp was automatically extracted from "${p.path}".`,
      cantOpenExtracted: (p: { path: string; error: string }) =>
        `Found "${p.path}" inside the package, but couldn't open it as .msapp: ${p.error}`,
      multipleMsappFound: (p: { paths: string }) =>
        `Multiple .msapp files found inside the package (${p.paths}); can't determine which one to analyze.`,
      flowFolderFound: (p: { count: number }) =>
        `The export package also contains Microsoft.Flow/ (${p.count} flow file(s)), not parsed in this phase yet.`,
      childrenItemNotObject: "Children item isn't an object; skipped.",
      childrenItemEmptyObject: "Children item is an empty object; skipped.",
      dataSourcesInvalidJson: (p: { path: string; error: string }) => `${p.path} isn't valid JSON: ${p.error}`,
      propertiesNotFound: (p: { path: string }) => `${p.path} not found; using the file name as the app's id/name.`,
      propertiesInvalidJson: (p: { path: string; error: string }) => `${p.path} isn't valid JSON: ${p.error}`,
      yamlParseError: (p: { error: string }) => `Failed to parse YAML: ${p.error}`,
      screenOrderInferred: {
        message:
          "Screen order was inferred from the alphabetical order of Src/*.pa.yaml files, not from an authoritative Studio source.",
        hint: "See docs/FORMAT-NOTES.md — real screen order is a known gap.",
      },
    },
    flow: {
      invalidJson: (p: { error: string }) => `Couldn't parse the file as JSON: ${p.error}`,
      notObjectAtRoot: "The JSON doesn't represent an object at the root level.",
      definitionNotFound: {
        message: 'Couldn\'t find "triggers"/"actions" at the root level or in "properties.definition".',
        hint: "Flow definition format not yet verified against a real file — see docs/FORMAT-NOTES.md section 4.",
      },
      noTrigger: 'No trigger found in "triggers".',
      multipleTriggers: (p: { count: number; firstKey: string }) =>
        `Found ${p.count} triggers; a flow normally has exactly one. Using "${p.firstKey}".`,
      noTriggerFallbackName: "(no trigger)",
    },
    solution: {
      cantOpenZip: (p: { error: string }) => `Couldn't open the file as a zip: ${p.error}`,
      solutionXmlNotFound: "solution.xml not found in the zip; solution metadata won't be available.",
      customizationsNoTables: "customizations.xml found, but no Dataverse table was recognized in it.",
      noArtifactsRecognized:
        "No artifact recognized inside the solution (neither CanvasApps/*.msapp, nor Workflows/*.json, nor a valid solution.xml).",
      solutionXmlInvalid: (p: { error: string }) => `solution.xml isn't valid XML: ${p.error}`,
      solutionXmlUnexpectedShape: {
        message: "solution.xml doesn't have the expected shape (ImportExportXml/SolutionManifest not found).",
        hint: "Format not yet verified against a real file — see docs/FORMAT-NOTES.md section 2.",
      },
      solutionXmlNoUniqueName: "solution.xml has no UniqueName.",
      unknownSolutionName: "Unknown solution",
      customizationsInvalidXml: (p: { error: string }) => `customizations.xml isn't valid XML: ${p.error}`,
      relationshipTypeUnrecognized: (p: { name: string; type: string }) =>
        `Relationship "${p.name}" with EntityRelationshipType "${p.type}" not recognized; skipped.`,
      dataverseTablesName: "Dataverse tables",
      childFlowNotFound: {
        message: (p: { actionName: string; ref: string }) =>
          `Action "${p.actionName}" seems to invoke another flow (reference "${p.ref}"), but no flow with that name was found in this solution.`,
        hint: "The child flow might be outside this solution/environment, or the name match failed — extraction not verified against a real definition.json.",
      },
    },
    powerbi: {
      cardinalityUnexpected: (p: { from: string; to: string }) =>
        `Relationship with cardinality "${p.from}"/"${p.to}" outside the expected range ("one"/"many"); treated as many-to-one.`,
      cantOpenZip: (p: { error: string }) => `Couldn't open the file as a zip: ${p.error}`,
      dataModelSchemaNotFound: 'Couldn\'t find "DataModelSchema" inside the file.',
      dataModelSchemaInvalidJson: (p: { error: string }) => `"DataModelSchema" isn't valid JSON: ${p.error}`,
      modelTablesNotFound: 'Couldn\'t find "model.tables" in DataModelSchema; model treated as empty.',
      reportLayoutInvalidJson: (p: { error: string }) => `"Report/Layout" isn't valid JSON: ${p.error}`,
      reportSectionsNotFound: 'Couldn\'t find "sections" in "Report/Layout"; report treated as having no pages.',
      pageFallback: (p: { n: number }) => `Page ${p.n}`,
      reportName: "Report",
    },
  },
  render: {
    summary: {
      formatLabel: {
        msapp: ".msapp (Canvas App)",
        solution: "Solution .zip",
        flow: "Flow definition",
        pbit: ".pbit",
        pbip: ".pbip",
        pbix: ".pbix",
      },
      format: "Format:",
      size: "Size:",
      analyzedAt: "Analyzed at:",
      parserVersion: "Parser version:",
      artifacts: "Artifacts:",
    },
    solutionMeta: {
      heading: (p: { name: string }) => `Solution: ${p.name}`,
      id: "Id:",
      version: "Version:",
      publisher: "Publisher:",
    },
    dataModel: {
      heading: (p: { name: string }) => `Data model: ${p.name}`,
      tables: "Tables:",
      relationships: "Relationships:",
      measures: "Measures:",
      tableHeading: (p: { name: string }) => `Table: ${p.name}`,
      columnTableHeader: "| Column | Type | Calculated |",
      yes: "yes",
      no: "no",
      relationshipsHeading: "Relationships",
      inactiveSuffix: ", inactive",
      measuresHeading: "Measures",
    },
    report: {
      heading: (p: { name: string }) => `Report: ${p.name}`,
      pageHeading: (p: { name: string }) => `Page: ${p.name}`,
      untitled: "(untitled)",
      none: "none",
      fieldsPrefix: "fields:",
    },
    diagnostics: {
      heading: "Diagnostics",
      none: "No diagnostics.",
      tableHeader: "| Severity | Code | Message | Path |",
    },
    canvasApp: {
      heading: (p: { name: string }) => `Canvas App: ${p.name}`,
      id: "Id:",
      screens: "Screens:",
      components: "Components:",
      dataSources: "Data sources:",
      variables: "Variables/collections:",
      onStartHeading: "App OnStart",
      dataSourcesHeading: "Data sources",
      variablesHeading: "Variables and collections",
      screenHeading: (p: { name: string }) => `Screen: ${p.name}`,
      componentHeading: (p: { name: string }) => `Component: ${p.name}`,
    },
    cloudFlow: {
      heading: (p: { name: string }) => `Flow: ${p.name}`,
      id: "Id:",
      trigger: "Trigger:",
      actions: "Actions:",
      connections: "Connections:",
      none: "none",
      actionsHeading: "Actions",
      branchSuffix: (p: { branch: string }) => `, branch "${p.branch}"`,
      insideParent: (p: { parentId: string; branch: string }) => ` (inside ${p.parentId}${p.branch})`,
    },
  },
};
