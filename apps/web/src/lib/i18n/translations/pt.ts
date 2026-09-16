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
