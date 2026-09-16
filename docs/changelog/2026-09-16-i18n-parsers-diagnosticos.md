# i18n dos diagnósticos de parser (detect + msapp/flow/solution/powerbi)

## O quê

Segundo incremento da tradução do site: `detect.ts` e todos os parsers
(`parsers/msapp/*`, `parsers/flow/*`, `parsers/solution/*`, `parsers/powerbi/*`) agora
geram `Diagnostic.message`/`.hint` via `getMessages(locale)`, em vez de template literal PT
hardcoded — mesmo padrão do incremento anterior (regras de health check). Novo namespace
`parsers` no dicionário (`i18n/messages/{en,pt,es}.ts`), com sub-namespaces `common`
(placeholders reaproveitados como "(sem nome)"/"(desconhecida)"/"(ausente)"), `detect`,
`msapp`, `flow`, `solution`, `powerbi`. `detectFormat`, `parseMsapp`, `parseSolution`,
`parseFlow`, `parsePbit` e toda função auxiliar que produz diagnóstico (`parseSourceFiles`,
`parseDataSources`, `parseAppMetadata`, `mapChildren`/`mapControl`/`mapRoot`,
`parseSolutionXml`, `parseCustomizationsXml`, `linkDependencies`, `mapCardinality`,
`parseReportLayout`) ganharam um `locale: Locale = DEFAULT_LOCALE` opcional, repassado pra
baixo na cadeia de chamadas (`parseSolution` passa seu `locale` pros parsers de msapp/flow
que invoca internamente pra artefatos embutidos).

## Por quê

Continuação do incremento anterior — "traduzir os diagnósticos" (decisão já tomada com o
usuário) inclui não só as 15 regras de health check, mas também as mensagens de erro/aviso
que os parsers emitem ao lidar com arquivo malformado ou estrutura inesperada.

## Decisões

- **Nomes-placeholder também entraram**, não só `Diagnostic.message`: valores como
  `"(sem nome)"` (coluna/tabela/medida do Power BI sem nome no schema), `"(desconhecida)"`
  (tabela/coluna de relacionamento ausente), `"(sem gatilho)"` (fallback de trigger de
  fluxo), `"Tabelas Dataverse"`/`"Relatório"`/`"Página N"` (nomes de artefato sintetizados)
  — são texto visível na documentação gerada e na árvore de artefatos, mesmo não sendo
  `Diagnostic.message`, então entram no mesmo dicionário (`parsers.common`/
  `parsers.<parser>.*`).
- **IDs ficam de fora, só display names entram**: o fallback de `solution.xml` sem
  `UniqueName` (`"unknown-solution"`, vira `SolutionMeta.id`) não foi traduzido — é um
  identificador técnico usado como chave em `customizations-xml.ts`
  (`solutionMeta?.id ?? "dataverse-tables"`), não texto pra exibição; só o fallback de
  `displayName` ("Unknown solution" → `messages.parsers.solution.unknownSolutionName`)
  entrou no dicionário.
- Assinatura sempre com `locale` opcional no fim, default `DEFAULT_LOCALE` — mantém
  compatível qualquer chamador que não passe locale (inclusive os testes existentes, que
  não precisaram de nenhum ajuste).

## Arquivos principais

`packages/core/src/i18n/messages/{en,pt,es}.ts` (namespace `parsers` novo),
`packages/core/src/detect/detect.ts`,
`packages/core/src/parsers/msapp/{parse,controls,data-sources,app-metadata,source-files}.ts`,
`packages/core/src/parsers/flow/parse.ts`,
`packages/core/src/parsers/solution/{parse,solution-xml,customizations-xml,link-dependencies}.ts`,
`packages/core/src/parsers/powerbi/{parse,report}.ts`.
