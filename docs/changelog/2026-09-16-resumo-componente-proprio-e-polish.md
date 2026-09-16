# Resumo vira componente próprio + polish (ilustrações, sombra, hover, animação, wallpaper)

## O quê

- `apps/web/src/components/document/SummarySection.tsx` (novo): toda a seção "Resumo"
  (antes um bloco grande dentro da `TabsContent value="summary"` do `DocumentView`)
  virou seu próprio componente, com `formatBytes` e o handler de `onDownloadContextPack`
  movidos junto (só eram usados ali). `DocumentView.tsx` agora só computa
  `flows`/`models`/`canvasApps` (precisa deles pras outras abas) e repassa as contagens.
- Ícones dos cards "Exportar" e "Explicação por IA" trocados pelas ilustrações que o
  usuário forneceu (`public/images/doc_heart.webp`, `ai.webp`), copiadas pra
  `apps/web/src/assets/images/` — as ilustrações 3D do Fluent Emoji usadas antes
  (`open-file-folder-3d.png`, `robot-3d.png`) foram removidas.
- Botões desses dois cards viraram `size="lg"`; o gap entre título e descrição do
  `CardHeader` diminuiu (`gap-0.5`) e o espaço entre a descrição e os botões aumentou
  (`mt-3` no `CardContent`).
- Todos os cards do Resumo (5 de métrica + Exportar + IA) ganharam `shadow-md`. Os cards
  de métrica (`StatTile`) ganharam hover state: sombra maior (`hover:shadow-lg`) e fundo
  em opacidade cheia (`hover:bg-card`, sem o `/60` translúcido).
- Entrada animada em cascata (fade-in de baixo pra cima, `motion/react`) pra cada card
  do Resumo ao carregar a página — desligada quando o usuário pede menos movimento
  (`prefers-reduced-motion`, via `useReducedMotion`).
- A linha única de metadados do arquivo ("pbit · 3.4 MB · analisado em ... · parser
  0.1.0") virou 4 itens com ícone (`lucide-react`: `File`, `HardDrive`, `CalendarClock`,
  `Tag`), lado a lado, em vez de uma frase separada por "·".
- Wallpaper decorativo: os 4 blobs de gradiente foram substituídos pela imagem que o
  usuário forneceu (`public/images/bg.jpg`, copiada pra
  `apps/web/src/assets/images/summary-bg.jpg`) — `opacity-30` no claro,
  `dark:opacity-20` + `dark:mix-blend-soft-light` no escuro (a imagem sozinha, sem
  blend, ficava esbranquiçada demais sobre o fundo escuro). Continua restrito à seção
  Resumo (mesmo `isolate` + `-z-10` do incremento anterior).

## Por quê

Pedido do usuário: (1) extrair o Resumo num componente próprio pra facilitar mexer nele
sem reler o resto do `DocumentView`; (2) trocar os ícones dos cards de Exportar/IA pelas
ilustrações que ele preparou; (3) polish geral de espaçamento, sombra e hover nos cards;
(4) uma animação de entrada na página; (5) reapresentar os metadados do arquivo como
itens com ícone em vez de uma linha corrida; (6) trocar o wallpaper gerado por gradientes
por uma imagem de fundo própria.

## Decisões

- **`bg.jpg`/`doc_heart.webp`/`ai.webp` foram copiados pra dentro de `apps/web/src/assets/`
  em vez de servidos como estáticos de `public/images/` (na raiz do monorepo)**: o `root`
  do Vite é `apps/web`, então um `public/` na raiz do repo nunca seria servido; e o app
  já usa exclusivamente `src/assets/` + import ES pros seus outros ícones/ilustrações
  (`connector-icons/`, `orbit-icons/`), então isso mantém o padrão existente (asset
  bundlado e com hash, não um path fixo). Os outros 3 arquivos que o usuário deixou em
  `public/images/` (`files.webp`, `grid.webp`, `text_content.webp`) não foram copiados —
  nenhum uso pra eles foi pedido neste incremento, e a regra do projeto é não criar
  arquivo pra feature futura.
- **Ícones da linha de metadados são `lucide-react`, não Fluent Color**: essa linha é
  informação densa (tipo/tamanho/data/versão), não uma métrica em destaque — ícones
  monocromáticos discretos (mesmo padrão já usado nos "trust facts" da tela de
  importação) combinam melhor aqui do que os ícones coloridos dos `StatTile`.
  `mix-blend-soft-light` (e não `multiply`/`overlay`) no wallpaper escuro: a imagem é
  clara (tons de verde-menta/branco) e `soft-light` a esmaece contra o fundo escuro sem
  apagar as formas nem virar um bloco sólido, o que `multiply` faria.

## Arquivos principais

- `apps/web/src/components/document/SummarySection.tsx`
- `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/components/document/StatTile.tsx`
- `apps/web/src/assets/images/{doc-heart.webp,ai.webp,summary-bg.jpg}`
