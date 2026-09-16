# Lint, limpeza de código morto e preparação pro build de produção

## O quê

- **ESLint configurado do zero** (não existia nenhum lint no projeto): flat
  config na raiz (`eslint.config.js`), `typescript-eslint` com regras
  type-aware, `eslint-plugin-react-hooks` e `eslint-plugin-react-refresh` só
  em `apps/web`. Scripts `pnpm lint`/`pnpm lint:fix` na raiz, e um passo
  `pnpm lint` novo em `.github/workflows/ci.yml` (antes do typecheck).
- **~40 erros reais corrigidos**, todos em `apps/web`/`packages/core`:
  - Promises soltas (`no-floating-promises`) em todos os `useEffect` que
    chamam as funções de layout do `@xyflow/react`/elkjs
    (`ScreenNavMap`, `FlowDagView`, `DependencyGraphView`, `MerView`) e nas
    chamadas imperativas de `fitView()` (que devolve uma Promise) — nenhuma
    delas tinha `.catch`, então uma rejeição (layout malformado, etc.) virava
    unhandled rejection silenciosa no console.
  - `AiExplanationCard`: `onGenerateRef.current = onGenerate` estava sendo
    escrito **durante o render**, não dentro de efeito — bug real (viola a
    regra de que refs só podem ser lidos/escritos fora do render). Corrigido
    movendo a atribuição pra um `useEffect` sem deps (roda depois de cada
    render, sempre com a versão mais nova de `onGenerate`).
  - `document.fonts?.ready` usado como condição booleana em `stroke-text.tsx`
    — `.ready` é uma Promise, então a condição testava se o objeto Promise
    era truthy (sempre é), não se as fontes existiam. Corrigido pra checar
    `document.fonts` (sem `.ready`) e só then/catch depois.
  - `ai/providers.ts`: respostas de `fetch(...).json()` eram `any` e
    vazavam pra `no-unsafe-*` em cascata. Adicionados tipos
    `AnthropicResponse`/`GeminiResponse` (shapes soltos, iguais ao resto do
    parsing do projeto — não validados por schema, só o suficiente pra tirar
    `any`).
  - `flow/condition.ts`: `Array.isArray` do TS estreita pra `any[]`, não
    `unknown[]` — todo `args[0]` depois de um `Array.isArray(args)` vazava
    `any`. Criado `isUnknownArray` (type guard local pra `unknown[]`) e
    trocado nos 4 call sites do arquivo.
  - `flow/parse.ts`: removida uma type assertion (`as RawWorkflowDefinition &
    RawFlowPackage`) desnecessária — o parâmetro já aceita `object` porque
    todos os campos do tipo são opcionais.
  - `flow/raw-shapes.ts` e `powerbi/raw-shapes.ts`: uniões redundantes tipo
    `"calculated" | string` (colapsam pra `string` puro em tempo de tipo,
    perdendo autocomplete sem ganhar nada). Trocado pelo idioma `"calculated"
    | (string & {})`, que preserva o autocomplete dos literais sem impedir
    qualquer outra string.
  - `FlowNodeInputsTree.tsx`: um `String(value)` onde `value` ainda podia,
    pro TS, ser tipado como objeto (`no-base-to-string`, teria virado
    `"[object Object]"` se acontecesse — na prática nunca acontece porque
    null/array/object já retornam antes, mas o narrowing de `unknown` do TS
    não enxerga isso no ramo negativo). Extraído pra uma variável tipada
    antes do `String(...)`.
  - Vários `onClick`/atributos recebendo função `async` direto
    (`no-misused-promises`) em `AiExplanationCard` e `MarkdownDocView`,
    ambas com try/catch interno (nunca rejeitam) — envolvidas em
    `() => void fn()` pra deixar explícito que é fire-and-forget
    intencional.
  - Duas uniões de tipo redundantes em testes (`test/rules/pl015-low-contrast.test.ts`
    tinha `ReturnType<typeof formula> | ReturnType<typeof literal>`, mas as
    duas funções retornam o mesmo tipo `Expression`) e dois `JSON.parse(...)`
    sem anotação (`test/ir.test.ts`, `test/render/context-pack.test.ts`) —
    anotados como `unknown`, mais honesto que o `any` implícito.
- **Código morto removido**:
  - Toda a mecânica de drawer mobile da sidebar (`Sidebar`'s `mobileOpen`/
    `onMobileClose` + botão de backdrop + classes `translate-x-full`,
    `Navbar`'s `onToggleSidebar`, `App.tsx`'s estado `sidebarOpen`) —
    inalcançável desde que o `MobileGate` (`md:hidden`/`hidden md:flex`)
    passou a bloquear o app inteiro abaixo do breakpoint `md`, ponto em que
    esse drawer faria sentido. Confirmado com Playwright que a sidebar
    continua idêntica visualmente depois da remoção.
  - Chaves de i18n órfãs (`nav.closeNav`, `navbar.openNav`) nas três
    traduções (en/pt/es), únicas consumidoras do botão removido acima.
  - Imports não usados em `DiagnosticsPanel.tsx`, `StatTile.tsx` e
    `Navbar.tsx` (sobras do redesign do shell em andamento).
- **Preparação pro build de produção**:
  - Banner e as 12 screenshots do README moveram de `public/images/` e
    `public/screenshots/` pra `.github/readme/` — `vite build` copia
    `publicDir` inteiro pro `dist/`, então esses ~1.7MB de imagens só pro
    GitHub estavam indo pro bundle publicado à toa. `README.md` atualizado
    pros novos caminhos.
  - `vercel.json` na raiz: `installCommand`/`buildCommand`/`outputDirectory`
    apontando pro workspace `apps/web` (monorepo pnpm — sem isso a Vercel
    não sabe que o deploy é só desse pacote nem resolve `workspace:*`
    corretamente a partir de um "Root Directory" isolado).
  - `pnpm build` (tsc + vite build) confirmado funcionando de ponta a ponta.

## Por quê

Pedido do usuário (fase 2, depois do README/banner/screenshots): rodar lint
em todo o projeto — que não tinha nenhum configurado —, limpar código morto
encontrado, e deixar o repo pronto pra primeira build de produção com deploy
planejado na Vercel.

## Decisões

- **`react-hooks/set-state-in-effect` desligada** pro app inteiro. É uma
  regra nova do `eslint-plugin-react-hooks` (voltada pro React Compiler) que
  marca qualquer `setState` síncrono dentro de um efeito como erro. As 4
  ocorrências encontradas (`SidebarFooter` setando um flag de "montado" pra
  evitar mismatch de hidratação — o próprio padrão documentado pelo
  `next-themes —, `RuleConfigDialog`/`GlobalSearch` resetando estado ao
  abrir/fechar, `WireframeView` sincronizando seleção a partir de uma prop)
  são idiomáticas e corretas; reescrever os 4 componentes só pra silenciar a
  regra não trazia benefício nenhum.
- **`react-refresh/only-export-components` desligada em
  `apps/web/src/components/ui/**`**: são componentes gerados pelo shadcn
  (`npx shadcn add`, ver `CLAUDE.md`) que exportam variantes (`buttonVariants`
  etc.) junto do componente — não editamos esse código à mão, então não faz
  sentido adaptar geração pra silenciar um aviso de fast refresh.
- **Linting type-aware precisou de um `tsconfig.eslint.json` por workspace**
  (`packages/core/tsconfig.eslint.json`, `apps/web/tsconfig.eslint.json`),
  cada um estendendo o `tsconfig.json` real só pra ampliar o `include` (testes
  e arquivos de config, ex. `vite.config.ts`) sem mexer no `tsconfig.json`
  usado por `tsc --noEmit`/build. O `projectService: true` do
  `typescript-eslint` não enxerga arquivo nenhum fora do `include` de algum
  tsconfig — daria erro de parsing em todo `*.test.ts` e `*.config.ts` sem
  isso.
- **Bundle de produção não foi otimizado nesta rodada.** `pnpm build` já
  avisa que o chunk principal passa de 500kB minificado (~966kB gzip),
  puxado por `@xyflow/react` + `elkjs` + `gsap` + `motion` +
  `react-markdown` num chunk só. Dava pra separar isso com `React.lazy` nas
  views por trás de aba (Flow/Dependências/MER, explicação por IA), mas é
  uma mudança estrutural maior que "lint + limpeza + build prep" — fica
  registrado aqui pra um incremento futuro, não resolvido de graça agora.
- Não commitei nenhuma mudança que já estivesse em andamento antes deste
  incremento (redesign de `Navbar`/`Sidebar`/`Logo`/`SettingsCorner`,
  `components.json`, etc.) além do que este próprio incremento precisou
  tocar — a limpeza de dead code caiu justamente em cima de sobras desse
  redesign (imports não usados, drawer mobile órfão), então os arquivos se
  sobrepõem, mas o que foi adicionado/removido aqui é só o descrito acima.

## Arquivos principais

- `eslint.config.js`, `packages/core/tsconfig.eslint.json`,
  `apps/web/tsconfig.eslint.json`, `package.json` (scripts `lint`/`lint:fix`)
- `apps/web/src/App.tsx`, `apps/web/src/components/nav/{Navbar,Sidebar}.tsx`
- `apps/web/src/components/{canvas/ScreenNavMap,flow/FlowDagView,graph/DependencyGraphView,mer/MerView}.tsx`
- `apps/web/src/components/ai/AiExplanationCard.tsx`,
  `apps/web/src/lib/ai/providers.ts`
- `packages/core/src/parsers/flow/{condition,parse,raw-shapes}.ts`,
  `packages/core/src/parsers/powerbi/raw-shapes.ts`
- `.github/workflows/ci.yml`, `vercel.json`
- `.github/readme/` (banner + screenshots, movidos de `public/`), `README.md`
