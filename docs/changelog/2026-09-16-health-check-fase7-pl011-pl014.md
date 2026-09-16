# Fase 7 do plano de novas features: PL011–PL014

## O quê

Quatro regras de health check novas, seguindo exatamente o padrão já existente em
`packages/core/src/rules/` (função pura `(doc) => Diagnostic[]`, um arquivo por regra,
registrada em `rules/index.ts`):

- **PL011** — ação de Cloud Flow "crítica" (tipo `Http` ou conector já listado como
  premium em PL009 — lista reaproveitada, exportada de `pl009-premium-connector.ts`) sem
  nenhum outro passo do mesmo fluxo tratando sua falha (`runAfter` com status
  `Failed`/`TimedOut`).
- **PL012** — `Foreach` aninhado dentro de outro `Foreach` (direto ou através de um
  `Scope`/`If` intermediário, subindo a cadeia de `parentId`).
- **PL013** — tabela ou coluna de um `DataModel` que não aparece em nenhum
  relacionamento nem em nenhuma fórmula encontrada no modelo (medida, coluna calculada,
  expressão de origem).
- **PL014** — relacionamento com forma arriscada: filtro cruzado bidirecional
  (`crossFilter: "both"`) ou cardinalidade muitos-para-muitos.

`packages/core/test/rules/helpers.ts` ganhou `flowNode`/`cloudFlow` (não existia
nenhum helper de `CloudFlow` pros testes de regra ainda, só de `CanvasApp`/`DataModel`).

## Por quê

Fase 7 do plano de 13 features novas acordado com o usuário (brainstorm sobre o que
seria mais impactante pra um builder de Power Platform usar no dia a dia). Este
incremento cobre as 4 regras que seguem 100% o padrão já existente, sem exigir decisão
de arquitetura nova — deixadas pra primeiro por serem o menor risco/maior certeza do
plano.

## Decisões

- **PL012 ficou só com a checagem de aninhamento**, sem a segunda checagem cogitada no
  plano original ("Foreach sem controle de concorrência configurado"). Ausência de
  `runtimeConfiguration.concurrency` é o comportamento *padrão* (execução sequencial) do
  Workflow Definition Language, não um sinal de problema — sinalizar isso daria
  recomendação errada pra quem depende de ordem sequencial de propósito. Como isso
  também exigiria estender o IR (`FlowNode` não carrega `runtimeConfiguration` hoje, só
  `inputs`) pra uma heurística que não é clara o suficiente, a checagem foi cortada do
  escopo — mesmo raciocínio já registrado no changelog de PL008 ("preferir uma lista
  curta e certa a uma lista longa e possivelmente errada").
- **PL011 reaproveita a lista de conectores premium de PL009** em vez de duplicar —
  `KNOWN_PREMIUM_CONNECTOR_IDS` foi exportado de `pl009-premium-connector.ts`.
- **PL013 usa busca textual com limite de palavra inteira** (`(?<!\w)nome(?!\w)`), não
  substring solta — sem isso, uma tabela `Order` seria marcada como "usada" só por
  aparecer dentro do nome `Orders` em qualquer expressão. Mesmo espírito de degradação
  honesta das regras existentes: hint explícito de que a extração é textual, não um
  parser de DAX/M de verdade, então falso positivo/negativo é possível.
- **PL014 não distingue relacionamento intencional de acidental** — os dois padrões
  (bidirecional, muitos-para-muitos) são legítimos em vários modelos reais, por isso
  severidade `info`, igual PL010.

## Arquivos principais

- `packages/core/src/rules/pl011-unhandled-critical-action.ts`
- `packages/core/src/rules/pl012-nested-foreach.ts`
- `packages/core/src/rules/pl013-unused-model-entity.ts`
- `packages/core/src/rules/pl014-risky-relationship-shape.ts`
- `packages/core/src/rules/pl009-premium-connector.ts` (export da lista)
- `packages/core/src/rules/index.ts`
- `packages/core/test/rules/helpers.ts` (`flowNode`, `cloudFlow`)
- `packages/core/test/rules/pl011..pl014-*.test.ts`
