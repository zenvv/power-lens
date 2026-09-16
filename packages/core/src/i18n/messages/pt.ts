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
} satisfies typeof en;
