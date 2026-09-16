# i18n do renderer de Markdown (documentação gerada)

## O quê

Terceiro incremento da tradução do site: `render/markdown/sections/*.ts` (`summary`,
`solution-meta`, `data-model`, `report`, `diagnostics`, `canvas-app`, `cloud-flow`) e
`render.ts` (`renderMarkdown`) agora recebem `locale: Locale = DEFAULT_LOCALE` e usam
`getMessages(locale).render.*` em vez de headings/labels PT hardcoded — a aba
"Documentação" (export `.md` determinístico, sem IA) passa a sair no idioma escolhido.
Novo namespace `render` no dicionário, com uma sub-chave por seção. `render-control-tree.ts`
não mudou — é puramente estrutural (`**nome** _(tipo)_`), sem prosa.

## Por quê

Continuação dos dois incrementos anteriores (regras + parsers) — a documentação Markdown
gerada é o artefato central da ferramenta (spec seção 7: "o baseline com o qual a saída da
IA é comparada"), então precisa acompanhar o idioma escolhido tanto quanto os diagnósticos.

## Decisões

- **"Solution" não foi traduzido** em nenhum dos três idiomas (`## Solution: ${name}`) —
  o texto original em PT já usava a palavra em inglês (termo técnico do Dataverse), mantido
  como estava nos três dicionários em vez de forçar uma tradução que o próprio autor
  original não fez.
- **`FORMAT_LABEL`** (mapa formato→label na seção Resumo) só teve a entrada `flow`
  traduzida ("Flow definition"/"Definição de fluxo"/"Definición de flujo") — as outras
  (`.msapp (Canvas App)`, `Solution .zip`, `.pbit`, `.pbip`, `.pbix`) já eram
  literais técnicos neutros de idioma no código original, mantidos idênticos nos três
  locales.
- Testes existentes de `markdown.test.ts` (que faziam assert em heading PT) passaram a
  chamar `renderMarkdown(doc, "pt")` explicitamente, em vez de reescrever os asserts —
  minimiza diff. Novo teste de smoke confere que o default (sem locale) sai em inglês e que
  `"es"` produz headings em espanhol.

## Arquivos principais

`packages/core/src/i18n/messages/{en,pt,es}.ts` (namespace `render` novo),
`packages/core/src/render/markdown/render.ts`,
`packages/core/src/render/markdown/sections/{summary,solution-meta,data-model,report,diagnostics,canvas-app,cloud-flow}.ts`,
`packages/core/test/render/markdown.test.ts`.
