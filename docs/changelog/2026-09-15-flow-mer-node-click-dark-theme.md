# Área de clique dos nodos do fluxo + Controls do React Flow em dark theme

## O quê

- No leitor de fluxo (`FlowDagView`/`FlowNode`), a área clicável de um bloco de ação
  agora é o retângulo inteiro do nó, não só a faixa ocupada pelo conteúdo. O bloco
  reservava `NODE_HEIGHT` (60px) no layout do ELK, mas o `div` clicável usava
  `h-max`, então sobrava espaço dentro do nó sem `onClick`.
- O painel `Controls` do React Flow (zoom in/out, fit view) nas telas de fluxo e de
  modelo de dados (MER) agora respeita o tema claro/escuro do app.

## Por quê

- Pedido do usuário: clicar perto da borda de um nó do fluxo não abria o inspector.
- Em seguida, o usuário reportou que um elemento do canvas não renderizava certo no
  dark theme (bloco branco sólido no canto do canvas) — era o `Controls` do React
  Flow, que vem com estilo próprio fixo em branco/preto via CSS vars `--xy-controls-*`,
  sem ligação com o tema do shadcn.

## Decisões

- Pra área de clique: trocar `h-max` por `h-full` no nó não-agrupado (`FlowNode.tsx`),
  com `justify-center` pro conteúdo continuar centralizado verticalmente dentro do
  espaço maior.
- Pra o `Controls`: em vez de sobrescrever manualmente as CSS vars `--xy-controls-*`,
  usar a prop nativa `colorMode` do `<ReactFlow>` (v12), que já traz um tema escuro
  completo embutido (`.react-flow.dark`) cobrindo `Controls`, `Background`, handles,
  seleção etc. Tema lido via `next-themes` (`resolvedTheme`), já usado pelo
  `ThemeToggle`.

## Arquivos principais

- `apps/web/src/components/flow/FlowNode.tsx`
- `apps/web/src/components/flow/FlowDagView.tsx`
- `apps/web/src/components/mer/MerView.tsx`
