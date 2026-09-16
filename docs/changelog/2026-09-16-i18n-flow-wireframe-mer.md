# i18n das visualizações de flow, wireframe e MER

## O quê

Oitavo incremento: `components/flow/{FlowDagView,FlowNode,FlowNodeInputsTree,
FlowNodeInspector,FlowBranchNode}.tsx`, `components/wireframe/{CanvasTreeView,
WireframeView,ControlBox}.tsx` e `components/mer/{MeasuresPanel,TableNode}.tsx` passam a
usar `useI18n()`.

## Por quê

Continuação da tradução do site — as três visualizações principais de artefato (diagrama de
fluxo, wireframe de tela, diagrama entidade-relacionamento) ainda tinham texto PT hardcoded
nos controles/labels ao redor do canvas (direção do layout, painel de inspeção, árvore de
telas, etc.).

## Decisões

- **`FlowBranchNode.tsx`** é um arquivo nascido durante este mesmo dia (commit paralelo do
  usuário, "Separa ramos true/false do If...") com um comentário explícito dizendo que não
  passaria por i18n porque "o resto da UI do viewer também é só PT-BR hardcoded" — verdade
  no momento em que foi escrito, mas esse pressuposto ficou desatualizado assim que os
  incrementos anteriores desta mesma tradução chegaram em `apps/web`. Traduzido junto
  (rótulos de ramo "Se sim"/"Se não"/"Caso padrão") e o comentário corrigido, pra não deixar
  um componente inconsistente com o resto do app recém-traduzido.
- **`CanvasTreeView`'s "Screens"** já estava em inglês no código PT-BR original (aparente
  esquecimento do autor) — normalizado como qualquer outro label: agora vem do dicionário
  (`t.wireframe.treeTitle`), traduzido nos três idiomas em vez de continuar como a única
  string inglesa solta no meio de uma UI então-toda-PT.

## Arquivos principais

`apps/web/src/lib/i18n/translations/{en,pt,es}.ts` (namespaces `flow`, `wireframe`, `mer`),
`apps/web/src/components/flow/{FlowDagView,FlowNode,FlowNodeInputsTree,FlowNodeInspector,FlowBranchNode}.tsx`,
`apps/web/src/components/wireframe/{CanvasTreeView,WireframeView,ControlBox}.tsx`,
`apps/web/src/components/mer/{MeasuresPanel,TableNode}.tsx`.
