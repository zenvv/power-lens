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
  documentView: {
    flowsTitle: "Flujos",
    flowsDescription: (p: { count: number }) => `${p.count} flujo(s) encontrado(s) en este artefacto.`,
    modelsTitle: "Modelos de datos",
    modelsDescription: (p: { count: number }) => `${p.count} modelo(s) encontrado(s) en este artefacto.`,
    appsTitle: "Apps",
    appsDescription: (p: { count: number }) => `${p.count} canvas app(s) encontrada(s) en este artefacto.`,
    flowItemDescription: (p: { triggerName: string; actionCount: number }) =>
      `Disparador: ${p.triggerName} · ${p.actionCount} acción(es) · gira la rueda para hacer zoom, haz clic en los grupos para colapsar`,
    modelItemDescription: (p: { tables: number; relationships: number; measures: number }) =>
      `${p.tables} tabla(s) · ${p.relationships} relación(es) · ${p.measures} medida(s) · gira la rueda para hacer zoom, haz clic en el encabezado de la tabla para colapsar las columnas, arrastra para reorganizar (la posición se guarda)`,
    appsItemDescription:
      "Blueprint estático por pantalla — los valores literales/aritmética constante se resuelven, el resto se convierte en un placeholder punteado marcado como dinámico. No es una simulación fiel de la app en ejecución.",
    docsTitle: "Documentación generada",
    docsDescription: "Exportación Markdown determinística, sin IA.",
  },
  diagnosticsPanel: {
    title: "Diagnósticos",
    description: "Problemas estructurales y de health check encontrados durante el análisis.",
    emptyFiltered: "Sin diagnósticos con la severidad seleccionada.",
    severityLabel: { error: "error", warning: "aviso", info: "info" },
  },
  markdownDoc: {
    read: "Lectura",
    raw: "Raw",
    copied: "Copiado",
    copy: "Copiar",
    downloadPdf: "Descargar PDF",
    downloadMd: "Descargar .md",
  },
  summary: {
    title: "Resumen",
    parserPrefix: "parser",
    dateLocale: "es-ES",
    stats: {
      artifacts: "artefacto(s)",
      flows: "flujo(s)",
      models: "modelo(s) de datos",
      apps: "canvas app(s)",
      diagnostics: "diagnóstico(s)",
    },
    diagnosticsDetail: (p: { errors: number; warnings: number; infos: number }) =>
      `${p.errors} error(es), ${p.warnings} aviso(s), ${p.infos} info`,
    exportTitle: "Exportar",
    exportDescription: "Todo se genera en el navegador, nada sale de tu máquina.",
    downloadDocButton: "Descargar documentación (.md)",
    downloadIrButton: "Descargar IR (ir.json)",
    downloadContextPackButton: "Descargar paquete de contexto (.zip)",
    aiTitle: "Explicación por IA",
    aiDescription: "Opcional: pídele a un LLM que explique este artefacto en lenguaje natural, con tu propia clave.",
    aiButton: "Generar explicación por IA",
  },
  ai: {
    settingsDialog: {
      title: "Clave de API (BYOK)",
      descriptionPart1: "Tu clave se guarda solo en el ",
      descriptionBold1: "localStorage de este navegador",
      descriptionPart2: ". Las llamadas van ",
      descriptionBold2: "directo de aquí al proveedor seleccionado",
      descriptionPart3:
        " — nunca pasan por Power Lens ni por ningún servidor nuestro, porque Power Lens no tiene servidor.",
      providerLabel: "Proveedor",
      openaiDisabledLabel: "OpenAI — la API no habilita CORS para llamadas directas desde el navegador",
      getKeyAt: "Consigue una clave en",
      modelLabel: "Modelo",
      apiKeyLabel: "Clave de API",
      apiKeyPlaceholder: "pega tu clave aquí",
      show: "Mostrar",
      hide: "Ocultar",
      removeKey: "Eliminar clave",
      save: "Guardar",
    },
    explanationCard: {
      title: "Explicación por IA",
      description:
        "Pídele a un LLM de tu elección que explique este artefacto en lenguaje natural. La llamada va directo desde tu navegador al proveedor, con tu propia clave — nada pasa por Power Lens.",
      keyLabel: (p: { key: string }) => `clave ${p.key}`,
      swap: "Cambiar",
      noKeyConfigured: "Todavía no hay ninguna clave de API configurada.",
      configureKey: "Configurar clave de API",
      generating: "Generando explicación…",
      regenerate: "Generar de nuevo",
      generate: "Generar explicación",
      errorTitle: "No se pudo generar la explicación",
      pdfErrorTitle: "No se pudo abrir el PDF",
      pdfErrorMessage: "No se pudo abrir la ventana de impresión — verifique si el navegador bloqueó una ventana emergente.",
      pdfDocTitle: (p: { fileName: string }) => `${p.fileName} — explicación por IA`,
    },
  },
  aiProviders: {
    anthropic: { label: "Anthropic (Claude)", modelHint: "ID de un modelo disponible en tu cuenta de Anthropic." },
    gemini: {
      label: "Google Gemini",
      modelHint: "ID de un modelo disponible en Google AI Studio (el nivel gratuito cubre flash).",
    },
    errors: {
      anthropicUnexpectedStatus: (p: { status: number }) => `Anthropic respondió ${p.status}.`,
      anthropicUnexpectedFormat: "La respuesta de Anthropic tiene un formato inesperado.",
      geminiUnexpectedStatus: (p: { status: number }) => `Gemini respondió ${p.status}.`,
      geminiUnexpectedFormat:
        "La respuesta de Gemini tiene un formato inesperado (el mensaje puede haber sido bloqueado por un filtro de seguridad).",
      networkError: "No se pudo contactar al proveedor. Verifique su conexión y que la clave de API sea correcta.",
    },
  },
  flow: {
    directionTopToBottom: "De arriba hacia abajo",
    directionLeftToRight: "De izquierda a derecha",
    hiddenActionsSuffix: (p: { count: number }) => `(${p.count} acción(es) oculta(s))`,
    inspector: {
      close: "Cerrar",
      description: "Descripción",
      connector: "Conector",
      runsAfter: "Se ejecuta después de",
      inputs: "Inputs",
      read: "Lectura",
      raw: "Raw",
      noInputs: "Este paso no declara inputs en la definición.",
    },
    inputsTree: {
      emptyObject: "Objeto vacío.",
    },
    branch: {
      ifTrue: "Si es verdadero",
      ifFalse: "Si es falso",
      defaultCase: "Caso predeterminado",
    },
  },
  wireframe: {
    treeTitle: "Pantallas",
    noScreens: "No hay pantallas para mostrar.",
    dynamicSuffix: " — posición/tamaño no resuelto, fórmula dinámica",
    dynamicLabel: "(dinámico)",
  },
  mer: {
    noMeasures: "No hay medidas en este modelo.",
    columnsAbbrev: "col.",
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
