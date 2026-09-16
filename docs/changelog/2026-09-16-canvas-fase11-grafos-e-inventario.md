# Fase 11 do plano de novas features: mapa de navegação, grafo de referência, inventário de componentes

## O quê

Três funções puras novas em `packages/core/src/analysis/canvas-app-graphs.ts`,
todas operando sobre um `CanvasApp` já parseado, sem campo novo no IR:

- **`buildScreenNavigationGraph(app)`** — um nó por `Screen`, uma aresta por
  referência `kind: "screen"` encontrada em qualquer fórmula do app (mesma
  fonte de dado que PL001 já usa pra decidir tela órfã). Navegação repetida
  pro mesmo destino vira uma aresta só com `count` somado, não duplicada;
  navegação disparada em `App.OnStart` usa um nó sintético `"App"` como
  origem (não é uma tela de verdade, não entra em `screens`).
- **`buildControlReferenceGraph(app)`** — uma aresta por referência distinta
  de qualquer controle (`Expression.references`, já extraído), deduplicada
  quando a mesma referência aparece em mais de uma propriedade do mesmo
  controle.
- **`buildComponentInventory(app)`** — contagem de uso de cada `Component`
  (controle cujo `type` é o nome do componente) em qualquer tela ou dentro
  de outro componente, incluindo componente com uso zero.

Cobre só `packages/core` — os três renderers visuais (`ScreenNavMap`,
`FormulaRefGraph`, `ComponentInventory` em `apps/web`) ficam pra quando o
redesenho em andamento estabilizar, mesma decisão das Fases 8/9/10/13/16.

## Por quê

Fase 11 do plano de 13 features.

## Decisões

- **Sem campo novo no IR** — as três funções reorganizam dado que já existe
  (`Screen`, `Expression.references`, `Component`/`Control.type`) em formato
  de grafo/contagem, em vez de extrair algo novo do arquivo bruto.
- **Sem gerar texto** (mesmo raciocínio da Fase 10): os três resultados são
  estrutura pura (nós, arestas, contagens), não frases — evita inventar
  chave de i18n pra uma UI que ainda não existe.
- **Auto-loop de navegação pra própria tela é descartado**, não vira aresta
  — não agrega informação visual (todo nó "pode ficar onde está").
- **`buildControlReferenceGraph` deduplica por `(controle, tipo, nome)`**,
  não por ocorrência bruta — o grafo responde "esse controle depende
  daquilo?", não "quantas fórmulas criam essa dependência" (isso já é o que
  PL006/busca global cobrem, de outro ângulo).

## Arquivos principais

- `packages/core/src/analysis/canvas-app-graphs.ts`, `analysis/index.ts`
- `packages/core/src/index.ts` (export)
- `packages/core/test/analysis/canvas-app-graphs.test.ts`
