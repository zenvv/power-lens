# Overdrive na tela de upload: órbita de apps, sidebar que aparece, loading otimista

## O quê

- `apps/web/src/components/upload/orbit-config.ts` (novo): configuração dos 7 nodos
  orbitais (Power Apps, Power Automate, Dataverse, SharePoint, Power BI, Excel, Power
  Pages) e das 7 conexões entre eles (topologia fixa refletindo integrações reais — ex.
  Dataverse como hub —, não proximidade geométrica).
- `apps/web/src/components/upload/OrbitField.tsx` (novo): fundo decorativo da tela de
  upload — nodos orbitando o dropzone central com drift orgânico (velocidade angular +
  "respiração" radial por nodo, via `requestAnimationFrame`, sem depender de física de
  spring pra isso) e linhas de conexão em SVG. Escreve posição direto no DOM via ref a
  cada frame (fora do ciclo de render do React) por performance. Respeita
  `prefers-reduced-motion` (layout estático, sem drift) e reage ao tamanho real do
  container via `ResizeObserver`.
- `apps/web/src/components/Dropzone.tsx`: reescrito sem borda — só ícone de documento +
  halo pulsante suave + descrição, centralizado sobre o `OrbitField`.
- `apps/web/src/components/HomeSection.tsx`: orquestra a coreografia idle → collapsing →
  loading. Ao soltar um arquivo, os nodos convergem pro centro (spring via `motion`,
  usando `animate()` imperativo em DOM refs — não `useMotionValue`, ver Decisões) em
  paralelo com a análise real (`onFile` dispara na hora, não espera a animação).
- `apps/web/src/components/nav/Sidebar.tsx`, `apps/web/src/App.tsx`: a sidebar não existe
  mais enquanto `status === "idle"` — só monta (com slide-in + fade via `motion.nav`)
  quando algo começa a acontecer (loading, erro, documento carregado).
- `apps/web/src/components/nav/Navbar.tsx`: novo prop `showSidebarToggle` — o botão de
  hambúrguer (mobile) some junto com a sidebar, já que não haveria o que abrir.
- `apps/web/src/components/LoadingState.tsx`: spinner num círculo (era um ícone com
  `animate-pulse`) + texto de etapa com crossfade a cada mudança.
- `apps/web/src/lib/analyze.ts`, `apps/web/src/lib/app-state.ts`, `apps/web/src/App.tsx`:
  `analyzeFile` ganhou um `onStage` opcional que emite as etapas reais do pipeline
  (detectar formato → ler estrutura → verificar integridade); `App.tsx` impõe um piso de
  1000ms no estado `loading` antes de resolver (design otimista, ver Decisões).
- `apps/web/package.json`: nova dependência `motion` (framer-motion) — primeira lib de
  animação do projeto; até aqui tudo era `tw-animate-css`/Tailwind puro.

## Por quê

Pedido do usuário via `/impeccable overdrive`: tela de upload atual (dropzone com borda
tracejada + texto) não comunicava nada sobre o produto; queria um centro de drop sem
borda cercado por nodos dos apps da Power Platform/Microsoft flutuando e se conectando, a
sidebar oculta nessa tela específica (só faz sentido depois que algo é importado), e um
loading "de design otimista" (~1s) com texto mostrando o que está sendo lido, mesmo o
parsing real sendo quase instantâneo.

## Decisões

- **Duas perguntas feitas ao usuário antes de implementar** (exigido pelo próprio
  `overdrive`, por ser o comando com maior risco de sair errado):
  - Abordagem técnica: usuário escolheu "Physics Orbit, Motion-Powered" — órbita com
    drift orgânico por `requestAnimationFrame` + `motion` orquestrando o slide-in da
    sidebar e a convergência dos nodos no loading (em vez de CSS-only ou canvas
    customizado).
  - Fonte dos ícones: usuário escolheu "Mix" — PNGs de conector já vendorizados em
    `assets/connector-icons/` pra Power BI, SharePoint, Excel e Dataverse (via
    `commondataserviceforapps.png`), e ícones coloridos do `@fluentui/react-icons`
    (`AppsColor`, `ArrowSyncColor`, `GlobeColor`) pra Power Apps, Power Automate e Power
    Pages — não existe logo oficial desses três vendorizado no repo.
- **`animate()` imperativo em vez de `useMotionValue`**: `useMotionValue` exigiria um
  hook por nodo dentro de um array de tamanho fixo (viável, mas cada nodo teria que ser
  seu próprio componente só pra isso). Como a posição orbital já é escrita direto no DOM
  via ref (por performance, fora do ciclo do React), a convergência final também anima o
  elemento DOM diretamente com `animate(el, {...}, {...})` da `motion` — sem precisar de
  `MotionValue` nem de um componente por nodo.
- **Spring trocado por tween na convergência dos nodos**: a primeira versão usava
  `type: "spring"` pra colapsar os nodos; visualmente terminava em ~300-400ms, mas a
  *promise* retornada só resolvia bem depois (spring só "termina" quando a velocidade cai
  abaixo de um limiar, não quando o valor already parece parado) — isso atrasava a
  transição pro spinner em mais de 700ms sem necessidade. Trocado por `duration: 0.42` +
  easing expo-out (`[0.16, 1, 0.3, 1]`), com resolução da promise previsível.
- **Bug real pego só com verificação em browser (não em typecheck/test)**: com
  `AnimatePresence` trocando "gate" (dropzone+órbita, ~520px de altura) por
  `LoadingState` em fluxo normal (`flex-col`), o elemento entrando ficava empurrado
  ~600px pra baixo do viewport enquanto o "gate" ainda ocupava espaço terminando de sumir
  — resultado: ~150ms de tela em branco a cada arquivo solto, com o spinner existindo no
  DOM mas fora da área visível. Corrigido posicionando os três estados (gate/loading/erro)
  como `absolute inset-0` dentro de um container `relative` de tamanho fixo, então eles se
  sobrepõem em vez de empilhar.
- **Progresso do loading é honesto, não fabricado**: em vez de inventar nomes de arquivo
  dentro do `.zip`/`.msapp` (que exigiria abrir o zip fora de `packages/core/src/parsers/`,
  violando a regra de arquitetura 1), o texto de etapa reflete as etapas reais e já
  existentes do pipeline (`detectFormat` → parser → `runHealthChecks`). Só a *duração
  mínima* de 1000ms é uma escolha de design deliberada — as etapas mostradas nela são
  reais, mesmo que na prática todas aconteçam em poucos ms.
- **Verificação visual via Playwright ad-hoc** (não há skill de "run" nem browser
  automation MCP disponível neste ambiente, e o `overdrive` exige iteração visual real,
  não só typecheck/test): instalado `playwright` com `npm install --no-save` só dentro do
  diretório de scratchpad da sessão, chromium já estava em cache local de uma verificação
  anterior. Rodei o app com `vite dev`, tirei screenshots (claro/escuro, idle, drop de um
  arquivo válido em vários checkpoints de tempo, arquivo não reconhecido, viewport mobile
  390px) e inspecionei bounding boxes via `page.evaluate` pra achar o bug de layout acima
  — não deu pra ver isso só lendo o código. Nada disso ficou no repo (scratchpad é fora do
  projeto).
- **Nodos ficam visíveis atrás do dropzone (sem `z-index` explícito)**: a ordem no DOM
  (`OrbitField` antes de `Dropzone`) já resolve a sobreposição correta; não foi necessário
  gerenciar `z-index` manualmente.

## Arquivos principais

- `apps/web/src/components/upload/{orbit-config.ts,OrbitField.tsx}` (novos)
- `apps/web/src/components/{Dropzone,HomeSection,LoadingState}.tsx`
- `apps/web/src/components/nav/{Sidebar,Navbar}.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/lib/{analyze.ts,app-state.ts}`
- `apps/web/package.json` (dependência `motion`)
