import type { en } from "./en";

export const pt = {
  nav: {
    groupAnalysis: "Análise",
    groupOutput: "Saída",
    summary: "Resumo",
    flows: "Fluxos",
    models: "Modelos de dados",
    apps: "Apps",
    diagnostics: "Diagnósticos",
    docs: "Documentação",
    ai: "Explicação por IA",
    closeNav: "Fechar navegação",
  },
  navbar: {
    notAffiliated: "Not afiliated with Microsoft",
    openNav: "Abrir navegação",
    artifactsCount: (p: { count: number }) => `${p.count} artefato(s)`,
    importFile: "Importar arquivo",
    diagnosticsAria: (p: { count: number }) => `${p.count} diagnóstico(s)`,
    downloadDoc: "Baixar Doc",
    downloadIr: "Baixar IR",
    openAi: "Abrir IA",
  },
  home: {
    trustFacts: [
      "100% local — nada sai da sua máquina",
      "Determinístico por padrão — IA é uma camada opcional",
      ".msapp · solution .zip · flow · .pbit/.pbip",
    ],
    titleBefore: "Entenda um artefato da ",
    titleAfter: "",
    subtitle:
      "Solte um arquivo pra ver o resumo estrutural, a visualização e a documentação gerada — sem abrir o Studio, sem ambiente.",
    unrecognizedBefore: "Não consegui reconhecer ",
    unrecognizedAfter: " como um arquivo suportado.",
    tryAnotherFile: "Tentar outro arquivo",
  },
  dropzone: {
    ariaLabel: "Solte um arquivo ou clique para escolher",
    receiving: "Recebendo o arquivo...",
    hint: "Solte um .msapp, solution .zip, .pbit ou .pbip aqui, ou clique para escolher",
  },
  loadingState: {
    reading: "Lendo",
  },
  mobileGate: {
    desktopOnly: "Disponível apenas para desktop",
    description: "Abra este link em um computador pra ler e navegar pelos artefatos da Power Platform.",
  },
  confirmDialog: {
    cancel: "Cancelar",
  },
  themeToggle: {
    toggleLabel: "Alternar tema claro/escuro",
  },
  app: {
    unexpectedError: (p: { error: string }) => `Erro inesperado ao analisar o arquivo: ${p.error}`,
    confirmImportTitle: "Importar outro arquivo?",
    confirmImportDescParsed: (p: { fileName: string }) =>
      `Isso descarta a análise atual de "${p.fileName}" e volta pra tela de importação. Nada fica salvo entre análises.`,
    confirmImportDescGeneric: "Isso descarta a análise atual e volta pra tela de importação.",
    confirmImportLabel: "Importar outro arquivo",
  },
  documentView: {
    flowsTitle: "Fluxos",
    flowsDescription: (p: { count: number }) => `${p.count} fluxo(s) encontrado(s) neste artefato.`,
    modelsTitle: "Modelos de dados",
    modelsDescription: (p: { count: number }) => `${p.count} modelo(s) encontrado(s) neste artefato.`,
    appsTitle: "Apps",
    appsDescription: (p: { count: number }) => `${p.count} canvas app(s) encontrado(s) neste artefato.`,
    flowItemDescription: (p: { triggerName: string; actionCount: number }) =>
      `Gatilho: ${p.triggerName} · ${p.actionCount} ação(ões) · role a roda pra dar zoom, clique nos grupos pra recolher`,
    modelItemDescription: (p: { tables: number; relationships: number; measures: number }) =>
      `${p.tables} tabela(s) · ${p.relationships} relacionamento(s) · ${p.measures} medida(s) · role a roda pra dar zoom, clique no cabeçalho da tabela pra recolher as colunas, arraste pra reorganizar (posição fica salva)`,
    appsItemDescription:
      "Blueprint estático por tela — valores literais/aritmética constante são resolvidos, o resto vira placeholder tracejado marcado como dinâmico. Não é uma simulação fiel do app rodando.",
    docsTitle: "Documentação gerada",
    docsDescription: "Exportação Markdown determinística, sem IA.",
  },
  diagnosticsPanel: {
    title: "Diagnósticos",
    description: "Problemas estruturais e de health check encontrados durante a análise.",
    emptyFiltered: "Nenhum diagnóstico com a severidade selecionada.",
    severityLabel: { error: "erro", warning: "aviso", info: "info" },
  },
  markdownDoc: {
    read: "Leitura",
    raw: "Raw",
    copied: "Copiado",
    copy: "Copiar",
    downloadPdf: "Baixar PDF",
    downloadMd: "Baixar .md",
  },
  summary: {
    title: "Resumo",
    parserPrefix: "parser",
    dateLocale: "pt-BR",
    stats: {
      artifacts: "artefato(s)",
      flows: "fluxo(s)",
      models: "modelo(s) de dados",
      apps: "canvas app(s)",
      diagnostics: "diagnóstico(s)",
    },
    diagnosticsDetail: (p: { errors: number; warnings: number; infos: number }) =>
      `${p.errors} erro(s), ${p.warnings} aviso(s), ${p.infos} info`,
    exportTitle: "Exportar",
    exportDescription: "Tudo gerado no navegador, nada sai da sua máquina.",
    downloadDocButton: "Baixar documentação (.md)",
    downloadIrButton: "Baixar IR (ir.json)",
    downloadContextPackButton: "Baixar pacote de contexto (.zip)",
    aiTitle: "Explicação por IA",
    aiDescription: "Opcional: peça pra um LLM explicar este artefato em linguagem natural, com a sua própria chave.",
    aiButton: "Gerar explicação por IA",
  },
  analyze: {
    formatLabel: {
      msapp: "app canvas (.msapp)",
      solution: "solution (.zip)",
      flow: "definição de flow",
      pbit: ".pbit/.pbip",
    },
    stageDetecting: "Detectando formato do arquivo",
    stageReadingStructure: (p: { formatLabel: string }) => `Lendo estrutura do ${p.formatLabel}`,
    stageVerifyingIntegrity: "Verificando integridade",
    parserNotImplemented: (p: { format: string }) =>
      `Formato "${p.format}" detectado, mas o parser ainda não está implementado nesta fase.`,
  },
} satisfies typeof en;
