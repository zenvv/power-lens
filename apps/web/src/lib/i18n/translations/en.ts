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
  themeToggle: {
    toggleLabel: "Toggle light/dark theme",
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
