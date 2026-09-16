# Fase 9 do plano de novas features: índice de busca global (núcleo)

## O quê

`packages/core/src/search/build-search-index.ts`: `buildSearchIndex(doc)`
percorre um `PowerLensDocument` inteiro e produz uma lista plana de
`SearchEntry` (`{ kind, name, artifactId, artifactName, path }`) — telas,
controles, fontes de dados e componentes de um Canvas App (declaração), mais
toda referência (`Reference`) encontrada em qualquer fórmula (uso); gatilho,
ações e conexões de um Cloud Flow; tabelas, colunas e medidas de um modelo de
dados. `searchIndex(entries, query)` filtra por substring, sem diferenciar
maiúscula/minúscula.

## Por quê

Fase 9 do plano de 13 features. Não precisou de campo novo no IR — toda
`Expression.references` já carregava `{ kind, name }` desde o schema
original, só faltava indexar. Reaproveita `forEachControl`/`forEachExpression`
de `rules/walk-canvas-app.ts` em vez de duplicar a travessia da árvore de
controles.

Igual à Fase 8, este incremento cobre só `packages/core` — a UI de busca
(`GlobalSearch.tsx`, campo no topo do shell) fica pra quando o redesenho em
andamento em `apps/web` estabilizar (decisão do usuário registrada no
changelog da Fase 8).

## Decisões

- **Sem busca textual dentro do `inputs` bruto de uma ação de fluxo.** O
  plano original cogitava isso (`inputs` é `unknown`, sem `Reference`
  estruturada) — cortado do escopo da v1 pra não misturar busca estruturada
  (por nome de entidade) com grep livre em JSON, que é um recurso
  qualitativamente diferente (mais ruidoso, sem noção de "campo"). Pode
  virar um v2 se fizer falta na prática.
- **Uma entrada por ocorrência, não por entidade única** — a mesma fonte de
  dados aparece uma vez como declaração (`path` = nome dela) e de novo em
  cada fórmula que a referencia (`path` = caminho até a propriedade). É
  exatamente o comportamento de "find usages": mostrar cada lugar, não só
  confirmar que existe.

## Arquivos principais

- `packages/core/src/search/build-search-index.ts`, `search/index.ts`
- `packages/core/src/index.ts` (export)
- `packages/core/test/search/build-search-index.test.ts`
