# Fase 9 (UI) do plano de novas features: busca global

## O quê

- `npx shadcn@latest add command` (shadcn `Command`/`CommandDialog`, cima do
  `cmdk`, já dependência do projeto).
- `apps/web/src/components/search/GlobalSearch.tsx` (novo): `CommandDialog`
  aberto por um botão "Search" no `Navbar` ou atalho `Cmd/Ctrl+K` (listener
  global em `App.tsx`). `buildSearchIndex(document)`/`searchIndex(index,
  query)` (núcleo) fazem toda a indexação/filtro — o componente só
  apresenta e resolve pra onde navegar.
- **Navegação ao selecionar um resultado**: sempre troca `activeSection` +
  o artefato ativo no `ArtifactTabs` certo (nova prop `activeId`, Fase 9
  também estendeu esse componente compartilhado). Resultado de `canvasApp`
  (control/screen/dataSource/variable/collection/function) chega no
  Wireframe já com a tela/controle certos selecionados
  (`WireframeView.initialSelection`, mesmo padrão "armado" da IA) — a
  resolução de qual tela/controle depende do `kind` da entrada
  (`resolveAppsSelection` em `GlobalSearch.tsx`, documentado inline: `path`
  de uma entrada de controle já é o caminho completo, de uma referência de
  uso é `Tela/Controle.Propriedade`, de uma declaração solta de dataSource é
  só o nome, sem tela).
- `ArtifactTabs<T>` ganhou `activeId?: string` (opcional, não quebra os 3
  usos existentes) — muda o item selecionado de fora sem tirar a liberdade
  do usuário de trocar pelo dropdown depois.
- Extraído `apps/web/src/components/canvas/CanvasAppView.tsx` (as 4 abas de
  um Canvas App, antes inline no `DocumentView`) — precisava virar
  componente próprio pra ter estado de aba controlado (saltar pra
  "Wireframe" quando a busca aponta pra lá, mesmo que outra aba estivesse
  ativa).

Fecha a Fase 9 da camada de UI (núcleo pronto desde
`2026-09-16-busca-fase9-indice-core.md`).

## Por quê

Quinta peça da sequência de UI.

## Decisões

- **Achado bloqueante durante a verificação, corrigido**: o `command.tsx`
  gerado pelo shadcn (preset "Nova" deste projeto) **não** embrulha
  `children` num `<Command>` — só monta o `Dialog`. Usar `CommandInput`/
  `CommandList`/`CommandItem` direto dentro de `CommandDialog` (sem um
  `<Command>` explícito por fora) quebra com
  `TypeError: Cannot read properties of undefined (reading 'subscribe')`
  assim que o diálogo abre — os primitivos do `cmdk` leem um contexto que
  só existe dentro de `<Command>`. Só apareceu rodando de verdade no
  browser (typecheck/test não pegam), confirmando de novo a regra do
  projeto de testar a UI ao vivo. Corrigido embrulhando explicitamente
  `<Command shouldFilter={false}>` por dentro do `<CommandDialog>`.
- **`shouldFilter={false}` no `Command`**: a filtragem já é feita por
  `searchIndex` (núcleo) sobre a `query` digitada — deixar o `cmdk` filtrar
  de novo por cima (fuzzy match dele) divergiria do resultado mostrado.
- **Só a seleção de controle no Wireframe é aprofundada** — resultado de
  `cloudFlow`/`dataModel` só troca de artefato no `ArtifactTabs`, sem
  selecionar o nó exato dentro do `FlowDagView`/`MerView` (cada um tem
  estado de seleção interno próprio, não exposto) — escopo já definido no
  plano aprovado, decisão explícita de não amarrar 3 view models diferentes
  a um controlador global de seleção.
- **Verificado ao vivo**: busca por "NavBar1" retorna 1 resultado
  (`Sample App · Screen1/NavBar1`); selecionar navega pra "Apps", aba
  Wireframe já ativa, `NavBar1` destacado na tree view e o canvas já
  scrollado até ele. Atalho `Ctrl+K` reabre a busca vazia.

## Arquivos principais

- `apps/web/src/components/search/GlobalSearch.tsx` (novo)
- `apps/web/src/components/canvas/CanvasAppView.tsx` (novo, extraído do
  `DocumentView`)
- `apps/web/src/components/ui/command.tsx` (shadcn, novo)
- `apps/web/src/components/document/ArtifactTabs.tsx` (`activeId`)
- `apps/web/src/components/wireframe/WireframeView.tsx` (`initialSelection`)
- `apps/web/src/components/nav/Navbar.tsx`, `apps/web/src/App.tsx`,
  `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/lib/i18n/translations/{en,pt,es}.ts` (namespace `search`)
