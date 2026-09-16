# Wireframe: referências entre irmãos, blocos sem cabeçalho, tree view lateral

## O quê

- `packages/core/src/render/wireframe/resolve-layout.ts`: `X`/`Y`/`Width`/`Height` agora
  também resolvem quando a fórmula referencia outro controle irmão já resolvido (ex.:
  `=Label1.Y + Label1.Height + 8`), não só `Parent.Width`/`Parent.Height` e aritmética
  pura. A resolução de um grupo de irmãos roda em passadas sucessivas (`resolveChildLayouts`):
  cada passada tenta resolver os que ainda faltam usando o que os outros já resolveram até
  ali; um valor resolvido fica congelado (nunca recalculado depois), então o processo é
  monotônico e sempre converge — não importa a ordem de declaração no YAML, nem se a
  referência é "pra frente". Uma referência circular de verdade nunca converge pra nenhum
  dos dois lados envolvidos — ficam `dynamic` honestamente.
- `apps/web/src/components/wireframe/ControlBox.tsx`: removida a barra de cabeçalho
  (tipo do controle) que aparecia no topo de cada bloco — agora só o conteúdo (texto,
  cor, borda) é exibido; tipo/nome continuam disponíveis via `title` (tooltip). Eixo
  posicionado que não resolveu não cai mais fixo em `(0,0)` (o que empilhava todo
  controle dinâmico exatamente um em cima do outro) — usa um deslocamento diagonal em
  cascata pela posição entre os irmãos (`DYNAMIC_CASCADE_STEP` em `wireframe-canvas.ts`)
  como fallback só visual, mantendo a borda tracejada como sinal de "não confiar nesse
  número".
- `apps/web/src/components/wireframe/CanvasTreeView.tsx` (novo): tree view lateral
  inspirada na do Power Apps Studio — uma tela por item de topo, um subitem recursivo
  por controle (nome + tipo), expansível. Clicar numa tela troca a tela ativa no canvas;
  clicar num controle destaca a caixa correspondente (`ring`) e rola ela pra dentro da
  área visível do canvas.
- `apps/web/src/components/wireframe/WireframeView.tsx`: layout em duas colunas (tree
  view + canvas) no lugar da fileira de botões por tela; guarda o controle selecionado e
  aciona o scroll-into-view via `data-control-name`.
- 4 testes novos em `packages/core/test/render/wireframe.test.ts` cobrindo referência a
  irmão resolvido, resolução independente de ordem de declaração, irmão que não resolve
  (mantém dynamic) e referência circular genuína.

## Por quê

Pedido do usuário: o wireframe renderizava só as caixas de `GroupContainer` mais externas,
vazias — layouts absolutos clássicos do Studio (a maioria dos apps reais, fora do
`AutoLayout` moderno) posicionam cada controle relativo a outro controle nomeado, não só
relativo ao `Parent`. Sem entender essas referências, praticamente todo `X`/`Y` virava
`dynamic` e cada controle desenhava um placeholder empilhado em `(0,0)`, tornando a tela
inteira ilegível. O usuário também pediu esconder o cabeçalho de cada bloco (mostrar só o
conteúdo) e uma tree view lateral parecida com a do Power Apps Studio.

## Decisões

- **Resolução em passadas (fixpoint), não resolução em um passe só**: layouts absolutos
  reais encadeiam controles em qualquer ordem de declaração no YAML (`B` referenciando
  `A` mesmo quando `A` vem depois de `B` na lista de `Children`). Resolver em um único
  passe por ordem de declaração deixaria esses casos "pra trás" como `dynamic`
  desnecessariamente. O processo converge porque cada `Resolved` que vira `resolved` fica
  congelado — nunca recalculado com um substituto diferente depois — então não há
  oscilação; o número de passadas é limitado por `children.length + 1` como teto de
  segurança, não porque precise disso na prática (a maioria dos casos reais converge em 2
  a 3 passadas).
- **Cascata diagonal em vez de agrupar tudo em `(0,0)`**: continua sendo um fallback
  puramente visual (a spec não promete simular o app rodando) — só evita a ilegibilidade
  de várias caixas dinâmicas exatamente sobrepostas. `DYNAMIC_CASCADE_STEP = 28` foi
  ajustado depois de testar com um fixture sintético (`If(varShowPanel, X, -1000)`, comum
  pra esconder/mostrar painel): com um passo pequeno (8px) dois controles dinâmicos
  adjacentes ainda ficavam quase totalmente sobrepostos.
- **Tree view construída a partir do `Control` cru, não do `ResolvedControl`**: a sidebar
  só precisa de nome/tipo/filhos pra listar a árvore — resolver layout de todas as telas
  só pra popular nomes seria custo e complexidade desnecessários (resolver layout já é
  feito sob demanda, só pra tela ativa).
- **Verificado num fixture sintético temporário (zipado localmente, nunca commitado)**:
  não havia um `.msapp` real disponível no repo pra validar visualmente (spec: nenhum
  arquivo de `fixtures/real/` é commitado) — um fixture com cadeia de referências
  (`HeaderLabel` → `SubLabel` → `SearchBox` → `AddButton` → `ResultsGallery`) e dois
  painéis com posição condicional (`If(...)`) confirmou a resolução em cadeia, o
  cabeçalho oculto e a seleção/scroll da tree view rodando no browser antes de considerar
  pronto.

## Arquivos principais

- `packages/core/src/render/wireframe/resolve-layout.ts`
- `packages/core/test/render/wireframe.test.ts`
- `apps/web/src/components/wireframe/{ControlBox,WireframeView,CanvasTreeView}.tsx`
- `apps/web/src/lib/wireframe-canvas.ts`
