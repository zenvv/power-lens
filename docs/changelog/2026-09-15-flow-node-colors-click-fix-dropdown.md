# Fluxo: causa raiz do clique nos nodos, cores por categoria, gatilho/fim, nomes sem GUID, dropdown de artefato

## O quê

- **Clique nos nodos, causa raiz.** O incremento anterior (`2026-09-15-flow-mer-node-click-dark-theme.md`)
  ampliou a área de clique do `div` do bloco, mas isso não era o problema real: com
  `selectable`/`draggable` desligados por nó e nenhum handler de clique no nível do
  `<ReactFlow>`, o React Flow marca o wrapper do nó com `pointer-events: none` (otimização
  da lib pra nodos totalmente estáticos) — nenhum clique chegava a disparar, em nenhum
  lugar do bloco, mesmo depois de arrastar o canvas. A seleção agora é feita por um
  `onNodeClick` no `<ReactFlow>` (`FlowDagView.tsx`), não mais por um `onClick` dentro do
  `FlowNode` — presença desse handler é o que faz a lib restaurar `pointer-events`.
- **Cor por categoria de action interna** (If/Switch/Scope/Foreach, variáveis,
  Compose/ParseJson, Terminate/Response/Request, Recurrence/Wait), num arquivo próprio
  (`flow-action-colors.ts`), aplicada ao ícone do grupo e ao fundo do quadrado de ícone
  do bloco — inspirado no agrupamento visual do Power Automate.
- **Gatilho em verde, fins do fluxo em vermelho.** `flow-layout.ts` agora calcula
  `isTrigger` (o nó do trigger) e `isEnd` (qualquer action que ninguém lista em
  `runAfter` — pode haver mais de um fim, um por ramo de If/Switch).
- **Nome de fluxo/modelo/app sem o GUID técnico.** `shortArtifactName` agora também
  remove um GUID no final do nome (`-D5A9B79A-500E-...`), que é o id interno do
  workflow na solution, não o nome dado por quem criou o fluxo.
- **Card de artefato com dropdown em vez de abas verticais.** `ArtifactTabs.tsx` foi
  reescrito: com mais de um item, o título do card vira um `Select` (dropdown) em vez de
  uma lista de abas ao lado — mesma função, ocupando bem menos espaço horizontal. Agora é
  o próprio `ArtifactTabs` que renderiza `Card`/`CardHeader`/`CardContent`, recebendo
  `description`/`contentClassName` de quem chama.

## Por quê

Pedido do usuário depois de ver o viewer de fluxo em uso: clique ainda não funcionava,
nomes de fluxo poluídos com GUID, blocos sem distinção visual de categoria/início/fim, e
a lista de fluxos como abas verticais ocupando espaço.

## Decisões

- Descobri a causa raiz do clique rodando a app de verdade num Chromium via Playwright
  (não havia `chromium-cli`/skill de projeto pra isso — instalado num projeto npm
  isolado em scratch, sem tocar no lockfile do monorepo) e inspecionando o bundle do
  `@xyflow/react`: `hasPointerEvents = isSelectable || isDraggable || onClick || ...`,
  onde `onClick` é o `onNodeClick` do `<ReactFlow>`, não o `onClick` interno do
  componente do nó. Confirmado depois com o driver: clique falhava 100% antes do fix,
  funcionava depois, inclusive após pan do canvas.
- `isEnd` é calculado globalmente (qualquer action que ninguém lista em `runAfter`),
  não só nas actions de primeiro nível — múltiplos fins de branch (If/else, por exemplo)
  todos ficam vermelhos, o que é o comportamento mais honesto pro que "fim de fluxo"
  significa aqui.
- Cores de `flow-action-colors.ts` são inspiradas no agrupamento visual do Power
  Automate, não uma cópia pixel-a-pixel da paleta oficial (não temos como validar contra
  a fonte oficial offline).
- `ArtifactTabs` passou a possuir o `Card` inteiro (título/descrição/conteúdo) em vez de
  só a escolha do item, porque o dropdown precisa substituir o `CardTitle`, que antes era
  responsabilidade de cada chamador em `DocumentView.tsx`.
- **Nota sobre escopo do commit:** havia trabalho não commitado de outra sessão/processo
  no mesmo working tree (upgrade de componentes shadcn, orbit field, `MarkdownDocView`
  com `react-markdown`, tema em `index.css`) que não faz parte deste incremento. Fiz o
  `DocumentView.tsx` deste commit a partir do `HEAD` + só o refactor do `ArtifactTabs`,
  sem a integração do `MarkdownDocView` (que depende de dependências ainda não
  commitadas em `package.json`/`pnpm-lock.yaml`) — o resto ficou intocado no working
  tree, sem entrar no commit.

## Arquivos principais

- `apps/web/src/components/flow/FlowDagView.tsx`
- `apps/web/src/components/flow/FlowNode.tsx`
- `apps/web/src/lib/flow-layout.ts`
- `apps/web/src/lib/flow-action-colors.ts`
- `apps/web/src/lib/artifact-name.ts`
- `apps/web/src/components/document/ArtifactTabs.tsx`
- `apps/web/src/components/DocumentView.tsx`
- `apps/web/test/flow-layout.test.ts`, `apps/web/test/artifact-name.test.ts`
