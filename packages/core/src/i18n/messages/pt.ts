import type { en } from "./en.js";

export const pt = {
  rules: {
    pl001: {
      label: "Tela órfã",
      message: (p: { screenName: string }) =>
        `Tela "${p.screenName}" não é referenciada por nenhuma navegação encontrada no app.`,
      hint: "A extração de referências é rasa (regex, não um parser de Power Fx completo) — confirme antes de remover a tela, pode haver um Navigate(...) em uma expressão que a análise não capturou.",
    },
    pl002: {
      label: "Controle com nome default",
      message: (p: { controlName: string }) =>
        `Controle "${p.controlName}" está com o nome default do Studio, nunca renomeado.`,
      hint: "Nomes descritivos facilitam entender fórmulas que referenciam o controle depois.",
    },
    pl003: {
      label: "Fonte de dados nunca referenciada",
      message: (p: { dataSourceName: string }) =>
        `Fonte de dados "${p.dataSourceName}" está declarada mas não foi encontrada em nenhuma fórmula do app.`,
      hint: "A extração de referências é rasa — confirme antes de remover a conexão, ela pode ser usada só dentro de um componente ou por uma expressão que a análise não capturou.",
    },
    pl004: {
      label: "GUID hardcoded em fórmula",
      message: (p: { count: number; propertyName: string }) =>
        p.count > 1
          ? `${p.count} GUIDs hardcoded encontrados em "${p.propertyName}".`
          : `GUID hardcoded encontrado em "${p.propertyName}".`,
      hint: "GUIDs de lista/tabela/ambiente colados direto na fórmula não sobrevivem a uma migração entre ambientes.",
    },
    pl005: {
      label: "App.OnStart muito longo",
      optionLabel: "Linhas máximas",
      message: (p: { lineCount: number; maxLines: number }) =>
        `App.OnStart tem ${p.lineCount} linhas (acima do limiar de ${p.maxLines}).`,
      hint: "Considere quebrar em componentes reutilizáveis ou mover parte da lógica pra funções nomeadas.",
    },
    pl006: {
      label: "Fórmula duplicada entre controles",
      optionLabel: "Ocorrências mínimas",
      message: (p: { preview: string; count: number }) =>
        `A fórmula ${p.preview} se repete em ${p.count} controles diferentes.`,
      hint: (p: { controls: string[] }) => `Controles: ${p.controls.join(", ")}`,
    },
    pl007: {
      label: "Propriedade de acessibilidade vazia",
      message: (p: { controlName: string; controlType: string }) =>
        `Controle "${p.controlName}" (${p.controlType}) não tem AccessibleLabel — leitor de tela não consegue descrevê-lo.`,
      hint: "Setar AccessibleLabel com um texto curto descrevendo a ação/conteúdo do controle.",
    },
    pl008: {
      label: "Função sem delegação sobre dado remoto",
      message: (p: { functions: string; dataSources: string; propertyName: string }) =>
        `${p.functions} sobre ${p.dataSources} em "${p.propertyName}" — nunca delega; só a primeira página da fonte remota é processada.`,
      hint: "Considere substituir por Filter/Sort (delegáveis, dependendo do conector) antes de percorrer o resultado.",
    },
    pl009: {
      label: "Conector premium em uso",
      message: (p: { dataSourceName: string; connectorId: string }) =>
        `Fonte de dados "${p.dataSourceName}" usa o conector "${p.connectorId}", que é premium.`,
      hint: "Confirme se todo usuário do app tem a licença necessária (Power Apps per-app/per-user ou equivalente) pra esse conector.",
    },
    pl010: {
      label: "Relacionamento inativo",
      message: (p: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }) =>
        `Relacionamento ${p.fromTable}.${p.fromColumn} → ${p.toTable}.${p.toColumn} está inativo.`,
      hint: "Só é aplicado explicitamente via USERELATIONSHIP em uma medida DAX — confirme se é intencional.",
    },
    pl011: {
      label: "Ação crítica sem tratamento de falha",
      message: (p: { actionName: string; connectorOrType: string }) =>
        `Ação "${p.actionName}" (${p.connectorOrType}) não tem nenhum passo tratando sua falha.`,
      hint: 'Adicione um passo com "Configurar execução após" (runAfter Failed/TimedOut) pra essa ação, ou confirme que uma falha silenciosa aqui é aceitável.',
    },
    pl012: {
      label: "Foreach aninhado",
      message: (p: { nodeName: string }) => `"${p.nodeName}" é um Foreach aninhado dentro de outro Foreach.`,
      hint: "Foreach aninhado é sequencial por natureza e escala mal — considere achatar a lista com Select/Filter array antes de um único loop.",
    },
    pl013: {
      label: "Tabela/coluna do modelo nunca referenciada",
      messageTable: (p: { tableName: string }) =>
        `Tabela "${p.tableName}" não aparece em nenhum relacionamento nem fórmula encontrada no modelo.`,
      hintTable:
        "A busca é textual, não um parser de DAX/M completo — confirme antes de remover, pode ser usada de um jeito que a análise não capturou.",
      messageColumn: (p: { tableName: string; columnName: string }) =>
        `Coluna "${p.tableName}.${p.columnName}" não aparece em nenhum relacionamento nem fórmula encontrada no modelo.`,
      hintColumn:
        "A busca é textual, não um parser de DAX/M completo — confirme antes de remover, pode ser usada só num visual do relatório.",
    },
    pl014: {
      label: "Relacionamento com forma arriscada",
      message: (p: { fromTable: string; fromColumn: string; toTable: string; toColumn: string; reasons: string }) =>
        `Relacionamento ${p.fromTable}.${p.fromColumn} → ${p.toTable}.${p.toColumn} tem forma arriscada: ${p.reasons}.`,
      reasons: {
        bidirectional: "filtragem cruzada bidirecional",
        manyToMany: "cardinalidade muitos-para-muitos",
      },
      hint: "Confirme se é intencional — filtro bidirecional e muitos-para-muitos são fontes comuns de resultado errado em medidas DAX.",
    },
    pl015: {
      label: "Contraste texto/fundo abaixo do recomendado",
      message: (p: { ratio: string; path: string }) =>
        `Contraste de ${p.ratio}:1 entre texto e fundo em "${p.path}", abaixo do mínimo recomendado (4.5:1).`,
      hint: "Calculado só quando Fill/Color resolvem pra uma cor totalmente opaca (literal ou RGBA constante) — texto grande tem um limite menor (3:1), não diferenciado aqui.",
    },
  },
  parsers: {
    common: {
      noName: "(sem nome)",
      unknown: "(desconhecida)",
      missing: "(ausente)",
    },
    detect: {
      pbipPointerOnly: {
        message:
          "Arquivos .pbip são apenas um ponteiro; o projeto real está em pastas irmãs (Report/, SemanticModel/) que não foram enviadas.",
        hint: "Envie a pasta do projeto inteira, não só o arquivo .pbip.",
      },
      notZipOrFlow: "Formato não reconhecido: o arquivo não é um zip nem um JSON de definição de fluxo.",
      zipCantOpen: (p: { error: string }) => `O arquivo tem assinatura de zip mas não pôde ser aberto: ${p.error}`,
      zipNoSignature:
        "Formato não reconhecido: é um zip, mas sem solution.xml, Src/*.pa.yaml, DataModelSchema ou DataModel.",
      extensionFallback: (p: { ext: string }) =>
        `Formato assumido pela extensão "${p.ext}" — a estrutura interna do zip não bateu com nenhuma assinatura conhecida.`,
    },
    msapp: {
      cantOpenZip: (p: { error: string }) => `Não foi possível abrir o arquivo como zip: ${p.error}`,
      extractedFromPackage: (p: { path: string }) =>
        `O arquivo era um pacote de export do Power Apps Studio; o .msapp foi extraído automaticamente de "${p.path}".`,
      cantOpenExtracted: (p: { path: string; error: string }) =>
        `Encontrado "${p.path}" dentro do pacote, mas não foi possível abri-lo como .msapp: ${p.error}`,
      multipleMsappFound: (p: { paths: string }) =>
        `Múltiplos arquivos .msapp encontrados no pacote (${p.paths}); não é possível determinar qual analisar.`,
      flowFolderFound: (p: { count: number }) =>
        `O pacote de export também contém Microsoft.Flow/ (${p.count} arquivo(s) de fluxo), que ainda não é parseado nesta fase.`,
      childrenItemNotObject: "Item de Children não é um objeto; ignorado.",
      childrenItemEmptyObject: "Item de Children é um objeto vazio; ignorado.",
      dataSourcesInvalidJson: (p: { path: string; error: string }) => `${p.path} não é um JSON válido: ${p.error}`,
      propertiesNotFound: (p: { path: string }) =>
        `${p.path} não encontrado; usando o nome do arquivo como id/nome do app.`,
      propertiesInvalidJson: (p: { path: string; error: string }) => `${p.path} não é um JSON válido: ${p.error}`,
      yamlParseError: (p: { error: string }) => `Falha ao interpretar YAML: ${p.error}`,
      screenOrderInferred: {
        message:
          "A ordem das telas foi inferida pela ordem alfabética dos arquivos Src/*.pa.yaml, não por uma fonte autoritativa do Studio.",
        hint: "Ver docs/FORMAT-NOTES.md — ordem real de telas é uma lacuna conhecida.",
      },
    },
    flow: {
      invalidJson: (p: { error: string }) => `Não foi possível interpretar o arquivo como JSON: ${p.error}`,
      notObjectAtRoot: "O JSON não representa um objeto no nível raiz.",
      definitionNotFound: {
        message: 'Não encontrei "triggers"/"actions" no nível raiz nem em "properties.definition".',
        hint: "Formato de definição de fluxo ainda não verificado contra um arquivo real — ver docs/FORMAT-NOTES.md seção 4.",
      },
      noTrigger: 'Nenhum gatilho encontrado em "triggers".',
      multipleTriggers: (p: { count: number; firstKey: string }) =>
        `Encontrados ${p.count} gatilhos; um fluxo normalmente tem exatamente um. Usando "${p.firstKey}".`,
      noTriggerFallbackName: "(sem gatilho)",
    },
    solution: {
      cantOpenZip: (p: { error: string }) => `Não foi possível abrir o arquivo como zip: ${p.error}`,
      solutionXmlNotFound: "solution.xml não encontrado no zip; metadados da solution não estarão disponíveis.",
      customizationsNoTables: "customizations.xml encontrado, mas nenhuma tabela Dataverse foi reconhecida nele.",
      noArtifactsRecognized:
        "Nenhum artefato reconhecido dentro da solution (nem CanvasApps/*.msapp, nem Workflows/*.json, nem solution.xml válido).",
      solutionXmlInvalid: (p: { error: string }) => `solution.xml não é um XML válido: ${p.error}`,
      solutionXmlUnexpectedShape: {
        message: "solution.xml não tem a forma esperada (ImportExportXml/SolutionManifest não encontrado).",
        hint: "Formato ainda não verificado contra um arquivo real — ver docs/FORMAT-NOTES.md seção 2.",
      },
      solutionXmlNoUniqueName: "solution.xml não tem UniqueName.",
      unknownSolutionName: "Solution desconhecida",
      customizationsInvalidXml: (p: { error: string }) => `customizations.xml não é um XML válido: ${p.error}`,
      relationshipTypeUnrecognized: (p: { name: string; type: string }) =>
        `Relacionamento "${p.name}" com EntityRelationshipType "${p.type}" não reconhecido; ignorado.`,
      dataverseTablesName: "Tabelas Dataverse",
      childFlowNotFound: {
        message: (p: { actionName: string; ref: string }) =>
          `A ação "${p.actionName}" parece invocar outro fluxo (referência "${p.ref}"), mas nenhum fluxo com esse nome foi encontrado nesta solution.`,
        hint: "O fluxo filho pode estar fora desta solution/ambiente, ou o match por nome falhou — extração não verificada contra um definition.json real.",
      },
    },
    powerbi: {
      cardinalityUnexpected: (p: { from: string; to: string }) =>
        `Relacionamento com cardinalidade "${p.from}"/"${p.to}" fora do esperado ("one"/"many"); tratado como muitos-para-um.`,
      cantOpenZip: (p: { error: string }) => `Não foi possível abrir o arquivo como zip: ${p.error}`,
      dataModelSchemaNotFound: 'Não encontrei "DataModelSchema" dentro do arquivo.',
      dataModelSchemaInvalidJson: (p: { error: string }) => `"DataModelSchema" não é um JSON válido: ${p.error}`,
      modelTablesNotFound: 'Não encontrei "model.tables" no DataModelSchema; modelo tratado como vazio.',
      reportLayoutInvalidJson: (p: { error: string }) => `"Report/Layout" não é um JSON válido: ${p.error}`,
      reportSectionsNotFound: 'Não encontrei "sections" em "Report/Layout"; relatório tratado como sem páginas.',
      pageFallback: (p: { n: number }) => `Página ${p.n}`,
      reportName: "Relatório",
    },
  },
  render: {
    summary: {
      formatLabel: {
        msapp: ".msapp (Canvas App)",
        solution: "Solution .zip",
        flow: "Definição de fluxo",
        pbit: ".pbit",
        pbip: ".pbip",
        pbix: ".pbix",
      },
      format: "Formato:",
      size: "Tamanho:",
      analyzedAt: "Analisado em:",
      parserVersion: "Versão do parser:",
      artifacts: "Artefatos:",
    },
    solutionMeta: {
      heading: (p: { name: string }) => `Solution: ${p.name}`,
      id: "Id:",
      version: "Versão:",
      publisher: "Publisher:",
    },
    dataModel: {
      heading: (p: { name: string }) => `Modelo de dados: ${p.name}`,
      tables: "Tabelas:",
      relationships: "Relacionamentos:",
      measures: "Medidas:",
      tableHeading: (p: { name: string }) => `Tabela: ${p.name}`,
      columnTableHeader: "| Coluna | Tipo | Calculada |",
      yes: "sim",
      no: "não",
      relationshipsHeading: "Relacionamentos",
      inactiveSuffix: ", inativo",
      measuresHeading: "Medidas",
    },
    report: {
      heading: (p: { name: string }) => `Relatório: ${p.name}`,
      pageHeading: (p: { name: string }) => `Página: ${p.name}`,
      untitled: "(sem título)",
      none: "nenhum",
      fieldsPrefix: "campos:",
    },
    diagnostics: {
      heading: "Diagnósticos",
      none: "Nenhum diagnóstico.",
      tableHeader: "| Severidade | Código | Mensagem | Caminho |",
    },
    canvasApp: {
      heading: (p: { name: string }) => `App Canvas: ${p.name}`,
      id: "Id:",
      screens: "Telas:",
      components: "Componentes:",
      dataSources: "Fontes de dados:",
      variables: "Variáveis/coleções:",
      onStartHeading: "OnStart do app",
      dataSourcesHeading: "Fontes de dados",
      variablesHeading: "Variáveis e coleções",
      screenHeading: (p: { name: string }) => `Tela: ${p.name}`,
      componentHeading: (p: { name: string }) => `Componente: ${p.name}`,
    },
    cloudFlow: {
      heading: (p: { name: string }) => `Fluxo: ${p.name}`,
      id: "Id:",
      trigger: "Gatilho:",
      actions: "Ações:",
      connections: "Conexões:",
      none: "nenhuma",
      actionsHeading: "Ações",
      branchSuffix: (p: { branch: string }) => `, branch "${p.branch}"`,
      insideParent: (p: { parentId: string; branch: string }) => ` (dentro de ${p.parentId}${p.branch})`,
    },
  },
  contextPack: {
    promptMd: (p: { fileName: string; format: string }) => `# Instruções para o LLM

Você recebeu um pacote de contexto gerado pelo Power Lens sobre o arquivo
"${p.fileName}" (${p.format}).

O arquivo \`ir.json\` neste pacote é uma representação estrutural completa e
determinística do artefato — telas, controles, fórmulas, fontes de dados,
fluxos, tabelas, conforme o caso. \`summary.md\` é a mesma informação já
formatada como documentação legível.

Use **apenas** o conteúdo de \`ir.json\`/\`summary.md\` como fonte de verdade
sobre a estrutura do artefato. Não invente controles, telas, fontes de dados
ou fórmulas que não apareçam nesses arquivos.

Tarefas sugeridas (adapte à sua necessidade):

1. Escreva um resumo em linguagem natural do que este artefato faz.
2. Liste riscos ou pontos de atenção que você observar na estrutura (nomes
   genéricos de controle, fórmulas repetidas, dependências externas).
3. Sugira um plano de teste manual cobrindo os principais fluxos de tela.

Diagnósticos em \`ir.json\` (campo \`diagnostics\`) apontam problemas que o
Power Lens já detectou estruturalmente — não repita esses achados como se
fossem seus, mas pode expandir sobre eles.
`,
    readmeTitle: "Power Lens — pacote de contexto",
    readmeBody: (p: { fileName: string; format: string; parsedAt: string }) => `Arquivo original: ${p.fileName}
Formato: ${p.format}
Gerado em: ${p.parsedAt}

Conteúdo deste pacote:

- ir.json      -> representação estrutural completa do artefato (a IR do Power Lens)
- summary.md   -> a mesma informação, já formatada como documentação Markdown
- PROMPT.md    -> instruções prontas para colar em um LLM (ChatGPT, Copilot, etc.)

Como usar: abra uma conversa com o LLM de sua preferência, cole o conteúdo de
PROMPT.md, e em seguida cole o conteúdo de ir.json (ou anexe o arquivo, se o
LLM aceitar anexos). Nenhum arquivo original da Power Platform está neste
pacote — apenas a estrutura extraída pelo Power Lens.
`,
  },
} satisfies typeof en;
