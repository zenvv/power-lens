# i18n do DocumentView, DiagnosticsPanel e seções de documento

## O quê

Sexto incremento: `DocumentView.tsx` (headers/descrições das abas Fluxos/Modelos/Apps/
Documentação, incluindo os textos de ajuda geradas por `ArtifactTabs`),
`DiagnosticsPanel.tsx` (título, descrição, empty state, e o label da severidade — que antes
renderizava o valor cru do enum `error`/`warning`/`info` direto na UI),
`document/MarkdownDocView.tsx` (abas Leitura/Raw, botões copiar/baixar) e
`document/SummarySection.tsx` (stats, cards de Exportar/Explicação por IA) passam a usar
`useI18n()`.

## Por quê

Continuação da tradução do site — estas são as telas que o usuário vê depois de importar um
arquivo (Resumo, abas por tipo de artefato, diagnósticos), o núcleo visível do dia a dia da
ferramenta.

## Decisões

- **`new Date(...).toLocaleString("pt-BR")` também virou locale-aware**
  (`t.summary.dateLocale`, mapeado pra `"en-US"`/`"pt-BR"`/`"es-ES"`) — não é uma string de
  UI, mas afeta o formato da data exibida (dia/mês vs. mês/dia, etc.), então contava como
  parte da tradução.
- **`severityLabel`** foi adicionado ao dicionário porque `DiagnosticsPanel` renderizava o
  valor cru do campo `Diagnostic.severity` (`"error"`/`"warning"`/`"info"`, sempre em
  inglês na IR — isso é correto, é um identificador estrutural) diretamente como texto pro
  usuário nos botões de filtro e nos badges; a tradução mora só na camada de exibição, a IR
  em si não muda.
- Descrições que antes eram JSX com texto solto (`<>Gatilho: {x} · {y} ação(ões)...</>`)
  viraram funções de string simples no dicionário — não tinham nenhuma marcação
  (bold/itálico) misturada, só interpolação, então não precisavam do tratamento
  `before`/`after` usado no incremento anterior pro título da Home.

## Arquivos principais

`apps/web/src/lib/i18n/translations/{en,pt,es}.ts` (namespaces `documentView`,
`diagnosticsPanel`, `markdownDoc`, `summary`), `apps/web/src/components/DocumentView.tsx`,
`apps/web/src/components/DiagnosticsPanel.tsx`,
`apps/web/src/components/document/{MarkdownDocView,SummarySection}.tsx`.
