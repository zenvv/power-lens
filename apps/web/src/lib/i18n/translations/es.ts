import type { en } from "./en";

export const es = {
  nav: {
    groupAnalysis: "Análisis",
    groupOutput: "Salida",
    summary: "Resumen",
    flows: "Flujos",
    models: "Modelos de datos",
    apps: "Apps",
    diagnostics: "Diagnósticos",
    docs: "Documentación",
    ai: "Explicación por IA",
    closeNav: "Cerrar navegación",
  },
  navbar: {
    notAffiliated: "Not afiliated with Microsoft",
    openNav: "Abrir navegación",
    artifactsCount: (p: { count: number }) => `${p.count} artefacto(s)`,
    importFile: "Importar archivo",
    diagnosticsAria: (p: { count: number }) => `${p.count} diagnóstico(s)`,
    downloadDoc: "Descargar Doc",
    downloadIr: "Descargar IR",
    openAi: "Abrir IA",
  },
  home: {
    trustFacts: [
      "100% local — nada sale de tu máquina",
      "Determinístico por defecto — la IA es una capa opcional",
      ".msapp · solution .zip · flow · .pbit/.pbip",
    ],
    titleBefore: "Entiende un artefacto de ",
    titleAfter: "",
    subtitle:
      "Suelta un archivo para ver el resumen estructural, la visualización y la documentación generada — sin abrir el Studio, sin necesidad de entorno.",
    unrecognizedBefore: "No pude reconocer ",
    unrecognizedAfter: " como un archivo compatible.",
    tryAnotherFile: "Probar otro archivo",
  },
  dropzone: {
    ariaLabel: "Suelta un archivo o haz clic para elegir uno",
    receiving: "Recibiendo el archivo...",
    hint: "Suelta un .msapp, solution .zip, .pbit o .pbip aquí, o haz clic para elegir",
  },
  loadingState: {
    reading: "Leyendo",
  },
  mobileGate: {
    desktopOnly: "Solo disponible para escritorio",
    description: "Abre este enlace en una computadora para leer y navegar los artefactos de Power Platform.",
  },
  confirmDialog: {
    cancel: "Cancelar",
  },
  themeToggle: {
    toggleLabel: "Alternar tema claro/oscuro",
  },
  app: {
    unexpectedError: (p: { error: string }) => `Error inesperado al analizar el archivo: ${p.error}`,
    confirmImportTitle: "¿Importar otro archivo?",
    confirmImportDescParsed: (p: { fileName: string }) =>
      `Esto descarta el análisis actual de "${p.fileName}" y vuelve a la pantalla de importación. Nada se guarda entre análisis.`,
    confirmImportDescGeneric: "Esto descarta el análisis actual y vuelve a la pantalla de importación.",
    confirmImportLabel: "Importar otro archivo",
  },
  analyze: {
    formatLabel: {
      msapp: "app canvas (.msapp)",
      solution: "solution (.zip)",
      flow: "definición de flujo",
      pbit: ".pbit/.pbip",
    },
    stageDetecting: "Detectando formato del archivo",
    stageReadingStructure: (p: { formatLabel: string }) => `Leyendo estructura de ${p.formatLabel}`,
    stageVerifyingIntegrity: "Verificando integridad",
    parserNotImplemented: (p: { format: string }) =>
      `Formato "${p.format}" detectado, pero el parser todavía no está implementado en esta fase.`,
  },
} satisfies typeof en;
