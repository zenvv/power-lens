# Shell unificado, tema claro/escuro e DocumentView em abas

## O quê

- `apps/web/index.html`, `apps/web/src/main.tsx`: removido o `class="dark"` fixo no
  `<html>`; a app agora usa `next-themes` (`ThemeProvider attribute="class" defaultTheme="system"
  enableSystem`) e suporta claro/escuro de verdade, com persistência automática em
  localStorage.
- `apps/web/src/components/nav/ThemeToggle.tsx`: botão sol/lua que alterna o tema.
- `apps/web/src/components/nav/Navbar.tsx`: passa a receber o `PowerLensDocument` (antes
  vinha comentado) e mostra nome do arquivo/formato/contagens + botão "Analisar outro
  arquivo" quando há um documento carregado — essa informação saiu do topo do
  `DocumentView`.
- `apps/web/src/App.tsx`: um único container de página (`Navbar` fixa + `main` com
  `max-w-6xl` e padding constante) para os três estados (idle/unrecognized/parsed), em vez
  de cada tela definir sua própria largura e centralização. Objetivo: a tela de leitura do
  documento e a tela de upload precisam parecer a mesma tela, só trocando o conteúdo.
- `apps/web/src/components/DocumentView.tsx`: reescrito para usar `Tabs` (shadcn/Radix) em
  vez de empilhar `Card`s verticalmente. Uma aba fixa "Resumo" (stats + downloads), uma aba
  por fluxo, uma aba por modelo de dados, uma aba por canvas app (wireframe), "Diagnósticos"
  (só aparece se houver diagnóstico) e "Documentação". `TabsList` fica num container com
  `overflow-x-auto` pra não quebrar quando há muitas abas.
- TODO deixado em `apps/web/src/components/flow/FlowDagView.tsx` e
  `apps/web/src/components/mer/MerView.tsx`: exportar o diagrama (DAG de fluxo / MER) como
  PNG ou SVG. Pedido do usuário depois de ver os diagramas renderizados — não implementado
  neste incremento, só registrado como pendência nos dois componentes (o `@xyflow/react` já
  expõe `getNodesBounds`/`getViewportForBounds`, que é o caminho natural quando for feito).

## Por quê

Direção visual escolhida pelo usuário via `/impeccable` (ver artifact de exploração da
conversa anterior): "Fluent Canon" — claro, cantos arredondados, paleta roxo/azul do Power
Platform. O usuário já tinha aplicado um novo preset shadcn (`radix-mira`/`mauve`, commit
anterior) e começado a navbar; este incremento continua esse trabalho: liga o tema
claro/escuro de verdade, unifica o shell das duas telas e resolve a reclamação de que
`DocumentView` obrigava a rolar muito pra navegar entre fluxo/modelo/app/diagnóstico —
existe bastante espaço horizontal não aproveitado.

## Decisões

- **Tema claro como leitura implícita do pedido**: o usuário só disse "adicionar tema
  claro"; como a direção escolhida (Fluent Canon) é clara por padrão e o `:root` do preset
  já define uma paleta clara completa, usei `defaultTheme="system"` com `enableSystem` (em
  vez de forçar light sempre) — respeita o SO por padrão e ainda permite alternar/persistir
  manualmente.
- **Cada fluxo/modelo/app vira aba própria, não uma aba "Fluxos" com sub-navegação**: era a
  leitura mais direta do pedido ("cada flow também tem que ter a própria aba") e evita mais
  um nível de navegação aninhada.
- **Downloads (.md/.ir.json/.zip) moveram para dentro da aba Resumo**, não ficaram como
  barra fixa acima das abas — como o nome do arquivo e o botão de reset já subiram pra
  navbar, não sobrou uma barra de ações "global" o suficiente pra justificar ficar sempre
  visível.
- **Export de diagrama como TODO, não feature**: pedido explícito do usuário pra não
  implementar agora, só deixar registrado. Preferi comentário `// TODO` direto nos dois
  componentes (ponto exato onde o botão de exportar vai nascer) a criar um arquivo de
  backlog novo — o `CLAUDE.md` pede pra não criar arquivos de placeholder pra features
  futuras.
- **Verificação em browser real via Playwright ad-hoc**: não havia skill de "run" nem
  `chromium-cli` disponíveis no ambiente; instalei `playwright` só dentro do diretório de
  scratchpad da sessão (`npm install --no-save`, fora do repo) pra não mexer no
  `package.json`/lockfile do projeto, subi o `vite dev` e tirei screenshots reais (idle
  claro/escuro, e com `fixtures/synthetic/flow-minimal/definition.json` carregado,
  claro/escuro) em vez de confiar só em `typecheck`/`test`. Ficou visível um bug cosmético
  pré-existente e não relacionado a este incremento: os controles de zoom do
  `@xyflow/react` (`+`/`-`/fit view) ficam com o ícone invisível no tema escuro (fundo e
  glifo ficam ambos claros) — não é regressão deste incremento (o app já rodava sempre em
  dark antes), só nunca tinha sido notado porque não havia como alternar/comparar temas.
  Não corrigido aqui por estar fora do escopo pedido; vale um incremento próprio.
- **Não toquei em `packages/core/src/index.ts`, `render/context-pack.ts`, `render/index.ts`
  nem em `apps/web/src/components/ai/`/`apps/web/src/lib/ai/`**: esses arquivos já estavam
  modificados/criados na árvore de trabalho por outra sessão em paralelo (a que "implementa
  as funções do app", camada de IA/BYOK) e não fazem parte do pedido deste incremento —
  ficaram de fora dos dois commits deste trabalho pra não misturar histórico nem commitar
  código ainda não revisado por quem está com ele.

## Arquivos principais

- `apps/web/index.html`, `apps/web/src/main.tsx`
- `apps/web/src/components/nav/{Navbar,ThemeToggle}.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/components/ui/tabs.tsx`
- `apps/web/src/components/flow/FlowDagView.tsx`, `apps/web/src/components/mer/MerView.tsx`
  (só os comentários TODO)
