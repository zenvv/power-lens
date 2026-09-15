# Health check: regras PL001–PL010 + painel com filtro por severidade

## O quê

- `packages/core/src/rules/`: uma regra pura `(doc: PowerLensDocument) => Diagnostic[]`
  por arquivo, `PL001`–`PL010` (spec seção 7), mais `walk-canvas-app.ts` (helper de
  travessia de controles reutilizado por várias regras) e `index.ts` (`runHealthChecks`
  agrega todas as 10).
- `DataSource.connectorId` novo no IR (`ir/schema.ts`), populado pelo parser `.msapp`
  (`data-sources.ts`) a partir do `ApiId` bruto (`shared_sql` → `"sql"`). Sem isso, PL009
  (conector premium) não tinha como distinguir SharePoint de SQL Server — `DataSource.type`
  só guarda a categoria genérica (`"ConnectedDataSourceInfo"` pra praticamente toda conexão
  real).
- `analyze.ts` (apps/web) roda `runHealthChecks(document)` depois de qualquer parser e funde
  o resultado em `document.diagnostics`, junto dos diagnósticos de parsing.
- `DiagnosticsPanel.tsx` novo, com badges de severidade clicáveis (liga/desliga
  error/warning/info) — spec seção 7: "painel de diagnósticos, filtro por severidade".
- 98 → mais testes em `packages/core/test/rules/` (11 arquivos, um por regra + agregador),
  com um helper `test/rules/helpers.ts` pra montar `PowerLensDocument`/`CanvasApp`/
  `DataModel` mínimos na mão, sem precisar passar por um parser real.
- Verificado ao vivo no browser contra o fixture `msapp-minimal`: PL002 (nome default) e
  PL007 (AccessibleLabel ausente) dispararam corretamente, e o filtro por severidade
  esconde/mostra diagnósticos ao clicar no badge.

## Por quê

Fase 4 do roadmap. As regras eram a única peça do IR (`Diagnostic`) que já existia desde o
começo do projeto mas nunca tinha um produtor de verdade além de erro de parsing.

## Decisões

- **PL002 exclui a raiz de tela** (`type === "Screen"`): a raiz de cada tela tem
  `type: "Screen"` e o próprio nome da tela (`"Screen1"`), que bate com o mesmo padrão
  `^Tipo\d+$` de um `Label1`/`Button2" esquecido — mas manter uma tela chamada "Screen1" é
  comum mesmo em apps bem cuidados (diferente de um controle), e sem essa exclusão a regra
  disparava em praticamente toda tela de todo app. Pego pelo próprio teste da regra, que
  falhou logo de cara.
- **PL007 lê "vazia" de forma ampla** (ausente conta como vazia): setar
  `AccessibleLabel: ""` explicitamente é raro; o gap real de acessibilidade é a propriedade
  nunca ter sido setada. Lista de tipos que precisam dela é conservadora (`Icon`, `Image`,
  `Button`, `Toggle`, `Rating`, `Slider`) — controles com texto próprio (`Label`,
  `TextInput`) ficam de fora.
- **PL008 escopo deliberadamente estreito**: só `ForAll` sobre uma fonte de dados remota. A
  Microsoft documenta `ForAll` como "nunca delega, ponto" — todas as outras funções
  candidatas (`Filter`, `Sort`, `Search`...) dependem do conector e dos operadores dentro do
  predicado, o que exigiria um parser de Power Fx de verdade (o projeto só faz extração rasa
  de referências). Preferiu-se uma lista curta e certa a uma lista longa e possivelmente
  errada — consistente com "degradação honesta".
- **PL009 dependeu de estender o IR** (`connectorId`), não só escrever a regra — a regra de
  arquitetura "se falta um dado, o IR que cresce" se aplicou aqui na prática. Lista de
  conectores premium também deliberadamente curta (`sql`, `salesforce`, `sap`,
  `oracledatabase`, `db2`, `documentdb`, `servicenow`, `workday`) — só os citados
  repetidamente como exemplo canônico na documentação oficial da Microsoft. Ausência de
  aviso não é prova de que o conector é standard.
- **Onde rodar as regras**: no boundary da UI (`analyze.ts`), não dentro de cada parser —
  as regras operam sobre o `PowerLensDocument` já montado (podem cruzar `CanvasApp` +
  `DataModel` no mesmo doc, caso de uma solution), então rodar uma vez no fim é mais simples
  e mais correto que espalhar a chamada em 4 parsers diferentes.
- **Limiares arbitrários documentados como tal**: PL005 (OnStart > 25 linhas) e PL006
  (fórmula repetida em ≥3 controles) não têm um número "certo" — os valores usados estão
  comentados no código como escolha, não como fato.

## Arquivos principais

- `packages/core/src/rules/` (11 arquivos)
- `packages/core/src/ir/schema.ts`, `packages/core/src/parsers/msapp/data-sources.ts`
- `packages/core/src/index.ts`
- `apps/web/src/lib/analyze.ts`, `apps/web/src/components/DiagnosticsPanel.tsx`,
  `apps/web/src/components/DocumentView.tsx`
- `packages/core/test/rules/` (12 arquivos)
