# Fase 11 (UI) do plano de novas features: três views novas de Canvas App

## O quê

Três abas novas dentro da aba "Apps" existente (ao lado do Wireframe, numa
`Tabs` aninhada por app), todas consumindo funções já prontas do núcleo:

- **`ScreenNavMap.tsx`** — mapa de navegação entre telas, layout `elkjs`
  próprio (`lib/screen-nav-layout.ts`, mesmo molde de `flow-layout.ts`/
  `mer-layout.ts`, sem grupos/collapse) sobre `buildScreenNavigationGraph`.
  Nó por tela + nó sintético "App" quando há navegação em `App.OnStart`
  (`ScreenNavNode.tsx`, ícone diferente pro nó sintético).
- **`ControlReferencesPanel.tsx`** — reusa `CanvasTreeView` (do Wireframe)
  como seletor de tela/controle; lista as entradas de
  `buildControlReferenceGraph` que saem do controle selecionado, agrupadas
  por ícone de `ReferenceKind`.
- **`ComponentInventory.tsx`** — tabela (shadcn `Table`, adicionado via
  `npx shadcn add table`) com `buildComponentInventory`, ordenada por uso
  decrescente, badge "unused" pro componente com `usageCount === 0`.

Fecha a Fase 11 da camada de UI (núcleo pronto desde
`2026-09-16-canvas-fase11-grafos-e-inventario.md`).

## Por quê

Quarta peça da sequência de UI — a mais trabalhosa das pequenas (3 telas em
vez de 1), mas toda a extração de dado já existia; era só construir a
apresentação.

## Decisões

- **`ControlReferencesPanel` vira painel de lista, não grafo visual** — ajuste
  de escopo já previsto no plano aprovado: a topologia de "um controle no
  centro, N referências ao redor" não ganha nada visualmente de um layout de
  grafo de verdade, e uma lista com ícone por tipo é mais fácil de ler.
- **Match de caminho até o controle selecionado feito localmente** na UI
  (`findControlPath`, busca em profundidade pela árvore da tela), não pelo
  núcleo — o `CanvasTreeView` só devolve o nome do controle selecionado
  (não o caminho completo `Tela/Pai/Filho`), e o núcleo já usa esse formato
  de caminho pra chave de `ControlReferenceEdge.from`.
- **`ScreenNavMap` sem controles de direção/collapse** (diferente do DAG de
  fluxo) — é deliberadamente um grafo pequeno e plano, não precisa da
  complexidade do `FlowDagView`.
- **Verificado ao vivo** com uma fixture sintética zipada na hora
  (`fixtures/synthetic/msapp-minimal`): as 4 abas renderizam sem erro, a
  aba de referências mostra corretamente que o `Fill` da tela referencia a
  função `RGBA` (`kind: "function"`), e o inventário lista `NavBar` com
  1 uso.
- **Achado durante a verificação, corrigido à parte**: `Navbar.tsx` (sob
  edição ativa do usuário em paralelo) tinha um `<div align="inline-end">`
  — atributo inválido em `div` nativo (sobra de um `InputGroupAddon`
  trocado por `div` puro no redesenho), quebrando `pnpm typecheck` pro
  projeto inteiro. Removido o atributo (não muda layout/comportamento,
  já que `align` não faz nada num `div`) pra destravar o gate — deixado
  fora deste commit de propósito, já que é um arquivo em edição ativa do
  usuário; a mudança fica no working tree pro próximo commit dele.

## Arquivos principais

- `apps/web/src/lib/screen-nav-layout.ts` (novo)
- `apps/web/src/components/canvas/{ScreenNavNode,ScreenNavMap,ControlReferencesPanel,ComponentInventory}.tsx` (novos)
- `apps/web/src/components/ui/table.tsx` (shadcn, novo)
- `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/lib/i18n/translations/{en,pt,es}.ts` (`documentView.appsTabs`,
  `canvasReferences`, `canvasComponents`)
