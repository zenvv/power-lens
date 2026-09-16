# Painel do bloco de fluxo: inputs em grupos legíveis + abas Leitura/Raw

## O quê

- `apps/web/src/components/flow/FlowNodeInputsTree.tsx`: renderiza o `inputs` bruto de um
  bloco (JSON arbitrário da Workflow Definition Language) como grupos e campos, em vez do
  JSON cru. Cada objeto aninhado vira um grupo (heading com o nome da chave + indentação
  via borda lateral); cada valor primitivo vira um campo label + texto não editável.
  Arrays viram grupos com itens indexados (`[0]`, `[1]`...). Funciona pra qualquer
  profundidade, já que o formato de `inputs` varia por tipo de ação/conector.
- `apps/web/src/components/flow/FlowNodeInspector.tsx`: a seção "Inputs" agora tem abas
  "Leitura" (a árvore de grupos/campos) e "Raw" (o JSON puro, como antes). Removida a
  seção "Outputs" e o texto explicando sua ausência — não agregava nada além do que já
  está no comentário do componente.

## Por quê

Pedido do usuário: o JSON cru do painel lateral (ex. um bloco `HTTP`/`OpenApiConnection`
com `parameters`, `host` etc. aninhados) é difícil de ler de relance. Separar em
grupo/campo com label deixa a estrutura do `inputs` navegável sem precisar parsear JSON
visualmente.

## Decisões

- **Labels não sofrem transformação de case** (ex. `apiId` vira "ApiId:", não "Api Id:")
  — são nomes literais de campos da WDL/API do conector; preservar a grafia original evita
  ambiguidade para quem for comparar com a definição real.
- **`inputs` que é string (ex. `"@triggerBody()"`, expressão dinâmica) não passa pela
  árvore** — cai direto num campo de texto não editável, já que não há o que agrupar.
- Testado ao vivo no browser (Playwright/Chromium) contra o fixture
  `fixtures/synthetic/flow-minimal/definition.json`, cobrindo um bloco com objeto aninhado
  (`When_an_item_is_created`, `host`/`parameters`) e um bloco com `inputs` string
  (`Compose`), nas duas abas.

## Arquivos principais

- `apps/web/src/components/flow/FlowNodeInputsTree.tsx` (novo)
- `apps/web/src/components/flow/FlowNodeInspector.tsx`
