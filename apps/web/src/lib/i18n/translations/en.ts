/**
 * Dicionário fonte da verdade (inglês, `DEFAULT_LOCALE`) da UI de `apps/web`
 * — mesma shape que `pt.ts`/`es.ts` implementam via `satisfies`. Segue o
 * padrão de `packages/core/src/i18n`: valor que interpola dado dinâmico é
 * função, texto fixo é string simples.
 */
export const en = {
  nav: {
    groupAnalysis: "Analysis",
    groupOutput: "Output",
    summary: "Summary",
    flows: "Flows",
    models: "Data models",
    apps: "Apps",
    diagnostics: "Diagnostics",
    docs: "Documentation",
    ai: "AI explanation",
    closeNav: "Close navigation",
  },
  navbar: {
    notAffiliated: "Not afiliated with Microsoft",
    openNav: "Open navigation",
    artifactsCount: (p: { count: number }) => `${p.count} artifact(s)`,
    importFile: "Import file",
    diagnosticsAria: (p: { count: number }) => `${p.count} diagnostic(s)`,
    downloadDoc: "Download Doc",
    downloadIr: "Download IR",
    openAi: "Open AI",
  },
  home: {
    trustFacts: [
      "100% local — nothing leaves your machine",
      "Deterministic by default — AI is an optional layer",
      ".msapp · solution .zip · flow · .pbit/.pbip",
    ],
    titleBefore: "Understand a ",
    titleAfter: " artifact",
    subtitle:
      "Drop a file to see the structural summary, the visualization, and the generated documentation — no Studio, no environment needed.",
    diagramOutcomeLabel: "Readable content",
    diagramOutcomeAlt:
      "Illustration representing the file turned into readable content",
    unrecognizedBefore: "I couldn't recognize ",
    unrecognizedAfter: " as a supported file.",
    tryAnotherFile: "Try another file",
  },
  dropzone: {
    ariaLabel: "Drop a file or click to choose one",
    receiving: "Receiving file...",
    hint: "Drop a .msapp, solution .zip, .pbit or .pbip here, or click to choose",
  },
  loadingState: {
    reading: "Reading",
  },
  mobileGate: {
    desktopOnly: "Desktop only",
    description: "Open this link on a computer to read and navigate Power Platform artifacts.",
  },
  confirmDialog: {
    cancel: "Cancel",
  },
  sidebarFooter: {
    resetData: "Reset data",
    rules: "Health check rules",
    language: "Language",
    languageNames: { en: "English", pt: "Portuguese", es: "Spanish" },
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    githubLink: "Power Lens on GitHub",
  },
  ruleConfig: {
    title: "Health check rules",
    description: "Turn a rule off, or adjust its threshold, without touching the file — changes apply the next time the document is analyzed.",
    resetAll: "Reset to defaults",
    save: "Save",
  },
  app: {
    unexpectedError: (p: { error: string }) => `Unexpected error while analyzing the file: ${p.error}`,
    confirmImportTitle: "Import another file?",
    confirmImportDescParsed: (p: { fileName: string }) =>
      `This discards the current analysis of "${p.fileName}" and returns to the import screen. Nothing is saved between analyses.`,
    confirmImportDescGeneric: "This discards the current analysis and returns to the import screen.",
    confirmImportLabel: "Import another file",
  },
  documentView: {
    flowsTitle: "Flows",
    flowsDescription: (p: { count: number }) => `${p.count} flow(s) found in this artifact.`,
    modelsTitle: "Data models",
    modelsDescription: (p: { count: number }) => `${p.count} model(s) found in this artifact.`,
    appsTitle: "Apps",
    appsDescription: (p: { count: number }) => `${p.count} canvas app(s) found in this artifact.`,
    flowItemDescription: (p: { triggerName: string; actionCount: number }) =>
      `Trigger: ${p.triggerName} · ${p.actionCount} action(s) · scroll to zoom, click groups to collapse`,
    modelItemDescription: (p: { tables: number; relationships: number; measures: number }) =>
      `${p.tables} table(s) · ${p.relationships} relationship(s) · ${p.measures} measure(s) · scroll to zoom, click the table header to collapse columns, drag to rearrange (position is saved)`,
    appsItemDescription:
      "Static blueprint per screen — literal values/constant arithmetic are resolved, the rest becomes a dashed placeholder marked as dynamic. Not a faithful simulation of the running app.",
    docsTitle: "Generated documentation",
    docsDescription: "Deterministic Markdown export, no AI.",
  },
  diagnosticsPanel: {
    title: "Diagnostics",
    description: "Structural and health-check problems found during analysis.",
    emptyFiltered: "No diagnostics with the selected severity.",
    severityLabel: { error: "error", warning: "warning", info: "info" },
  },
  markdownDoc: {
    read: "Read",
    raw: "Raw",
    copied: "Copied",
    copy: "Copy",
    downloadPdf: "Download PDF",
    downloadMd: "Download .md",
  },
  summary: {
    title: "Summary",
    parserPrefix: "parser",
    dateLocale: "en-US",
    stats: {
      artifacts: "artifact(s)",
      flows: "flow(s)",
      models: "data model(s)",
      apps: "canvas app(s)",
      diagnostics: "diagnostic(s)",
    },
    diagnosticsDetail: (p: { errors: number; warnings: number; infos: number }) =>
      `${p.errors} error(s), ${p.warnings} warning(s), ${p.infos} info`,
    exportTitle: "Export",
    exportDescription: "Everything generated in the browser, nothing leaves your machine.",
    downloadDocButton: "Download documentation (.md)",
    downloadIrButton: "Download IR (ir.json)",
    downloadContextPackButton: "Download context pack (.zip)",
    aiTitle: "AI explanation",
    aiDescription: "Optional: ask an LLM to explain this artifact in natural language, using your own key.",
    aiButton: "Generate AI explanation",
  },
  ai: {
    settingsDialog: {
      title: "API Key (BYOK)",
      descriptionPart1: "Your key is saved only in this browser's ",
      descriptionBold1: "localStorage",
      descriptionPart2: ". Requests go ",
      descriptionBold2: "straight from here to the selected provider",
      descriptionPart3:
        " — they never pass through Power Lens or any server of ours, because Power Lens has no server.",
      providerLabel: "Provider",
      openaiDisabledLabel: "OpenAI — API doesn't allow CORS for direct browser calls",
      getKeyAt: "Get a key at",
      modelLabel: "Model",
      apiKeyLabel: "API Key",
      apiKeyPlaceholder: "paste your key here",
      show: "Show",
      hide: "Hide",
      removeKey: "Remove key",
      save: "Save",
    },
    explanationCard: {
      title: "AI explanation",
      description:
        "Ask an LLM of your choice to explain this artifact in natural language. The call goes straight from your browser to the provider, using your own key — nothing goes through Power Lens.",
      keyLabel: (p: { key: string }) => `key ${p.key}`,
      swap: "Swap",
      noKeyConfigured: "No API key configured yet.",
      configureKey: "Configure API key",
      generating: "Generating explanation…",
      regenerate: "Generate again",
      generate: "Generate explanation",
      errorTitle: "Couldn't generate the explanation",
      pdfErrorTitle: "Couldn't open the PDF",
      pdfErrorMessage: "Couldn't open the print window — check whether your browser blocked a pop-up.",
      pdfDocTitle: (p: { fileName: string }) => `${p.fileName} — AI explanation`,
    },
  },
  aiProviders: {
    anthropic: { label: "Anthropic (Claude)", modelHint: "ID of a model available in your Anthropic account." },
    gemini: {
      label: "Google Gemini",
      modelHint: "ID of a model available in Google AI Studio (the free tier covers flash).",
    },
    errors: {
      anthropicUnexpectedStatus: (p: { status: number }) => `Anthropic responded ${p.status}.`,
      anthropicUnexpectedFormat: "Anthropic's response is in an unexpected format.",
      geminiUnexpectedStatus: (p: { status: number }) => `Gemini responded ${p.status}.`,
      geminiUnexpectedFormat:
        "Gemini's response is in an unexpected format (the message may have been blocked by a safety filter).",
      networkError: "Couldn't reach the provider. Check your connection and whether the API key is correct.",
    },
  },
  flow: {
    directionTopToBottom: "Top to bottom",
    directionLeftToRight: "Left to right",
    hiddenActionsSuffix: (p: { count: number }) => `(${p.count} hidden action(s))`,
    inspector: {
      close: "Close",
      description: "Description",
      connector: "Connector",
      runsAfter: "Runs after",
      inputs: "Inputs",
      read: "Read",
      raw: "Raw",
      noInputs: "This step doesn't declare inputs in the definition.",
    },
    inputsTree: {
      emptyObject: "Empty object.",
    },
    branch: {
      defaultCase: "Default case",
      empty: "Empty",
    },
    trigger: {
      scheduled: "Runs on a schedule",
      scheduledWithSchedule: (p: { interval: number; frequency: string }) =>
        `Runs every ${p.interval} ${p.frequency}`,
      manual: "Runs on demand — triggered directly, not by a schedule or an external event",
      event: (p: { connectorName: string }) => `Runs when an event happens in ${p.connectorName}`,
      eventGeneric: "Runs when an external event happens",
      unknown: (p: { type: string }) => `Trigger type "${p.type}" — see the raw inputs for details`,
      frequency: {
        minute: "minute(s)",
        hour: "hour(s)",
        day: "day(s)",
        week: "week(s)",
        month: "month(s)",
      },
    },
  },
  wireframe: {
    treeTitle: "Screens",
    noScreens: "No screens to show.",
    dynamicSuffix: " — position/size not resolved, dynamic formula",
    dynamicLabel: "(dynamic)",
  },
  mer: {
    noMeasures: "No measures in this model.",
    columnsAbbrev: "col.",
  },
  analyze: {
    formatLabel: {
      msapp: "canvas app (.msapp)",
      solution: "solution (.zip)",
      flow: "flow definition",
      pbit: ".pbit/.pbip",
    },
    stageDetecting: "Detecting file format",
    stageReadingStructure: (p: { formatLabel: string }) => `Reading ${p.formatLabel} structure`,
    stageVerifyingIntegrity: "Verifying integrity",
    parserNotImplemented: (p: { format: string }) =>
      `Format "${p.format}" detected, but the parser isn't implemented in this phase yet.`,
  },
};
