# Refinamento do orbit field: mais apps, anel único, nodos coloridos

## O quê

- `apps/web/src/components/upload/orbit-config.ts`: de 7 pra 10 nodos — adiciona
  Microsoft Teams e Microsoft 365 (reaproveitando `teams.png`/`office365.png`, já
  vendorizados em `assets/connector-icons/` pra outro propósito) e Power Platform
  (ícone `MoleculeColor`, novo — não tem PNG oficial vendorizado). Troca o ícone de
  Power Automate de `ArrowSyncColor` pra `ArrowClockwiseDashesColor` (lê melhor como
  "automação recorrente" do que um sync genérico). Layout deixa de ter raio por nodo
  (`radius` no config) — agora todos os nodos "reais" ficam no mesmo raio
  (`MAIN_RADIUS` em `OrbitField.tsx`), formando um único anel em vez de anéis
  concêntricos.
- `apps/web/src/components/upload/OrbitField.tsx`: adiciona uma segunda cópia
  decorativa de cada nodo (`ghost`) — 56% do tamanho, ~32% de opacidade, num raio
  1.24x maior, girando mais devagar (parallax: mais devagar = lê como "mais longe") e
  com um offset angular fixo (intercalada entre os nodos reais, não atrás deles). Sem
  conexões — só profundidade. Nodos reais e fantasmas perdem a sombra colorida e
  ganham borda + fundo na cor do próprio app (`oklch(... / alfa)`, alfa maior na borda
  que no fundo). As linhas de conexão trocam de cinza sólido pra gradiente SVG entre a
  cor do nodo de origem e a do destino (`<linearGradient>` por aresta, recalculado a
  cada frame junto com a posição), a 45% de opacidade.
- `apps/web/src/components/upload/orbit-config.ts`: topologia de conexões redesenhada
  pras 9 arestas ficarem legíveis com 10 nodos e linhas agora coloridas/mais visíveis
  (Dataverse como hub dos 4 produtos "Power" + Power Platform, Automate como
  orquestrador pro SharePoint/Teams/Microsoft 365, Power BI–Excel).
- `apps/web/src/components/Dropzone.tsx`, `OrbitField.tsx`: raio do anel principal
  subiu de ~118-214 (variável) pra 190 fixo, e o texto/ícone do dropzone ficam menores
  em telas estreitas (`max-w-28`/`text-xs`/ícone `size-12` abaixo do breakpoint `sm`) —
  a versão anterior media a "área segura" só pensando em desktop; em ~390px de largura
  o texto de 3 linhas colidia visualmente com os nodos do anel.

## Por quê

Feedback do usuário depois de ver a primeira versão do overdrive: faltavam nodos
(Power Apps e Power Automate "não pareciam" representados — eram ícones genéricos
demais —, e Office 365/Teams/Power Platform nem existiam), queria um único círculo em
vez da disposição em anéis variados (com mais espaço vazio no centro pro input), uma
segunda camada de nodos menores/mais transparentes repetindo os mesmos ícones pra dar
profundidade, e um visual sem sombra com borda+fundo coloridos nos nodos e linhas de
conexão coloridas (gradiente entre as duas pontas, ~45% de opacidade).

## Decisões

- **Sem logo oficial vendorizado pra Power Platform**: diferente de Teams/Office 365
  (que já tinham PNG no repo, usados hoje só pra ícones de conector de flow), não existe
  asset de marca do "Power Platform" em si no projeto. Segui a mesma política acordada
  no incremento anterior (Fluent Color como fallback): `MoleculeColor` — um ícone de
  rede/nodos conectados, que亦 funciona como metáfora do próprio orbit field.
- **9 arestas pra 10 nodos, não uma malha completa**: com linhas coloridas e mais
  visíveis que antes (opacidade 45% vs. ~12% da versão anterior), uma topologia densa
  (ex.: todo mundo conectado com todo mundo) ficaria visualmente carregada. Mantive
  Dataverse e Automate como os dois "hubs" (5 e 4 conexões respectivamente) e o resto
  com 1-2 conexões cada — reflete papéis reais (Dataverse = camada de dados
  compartilhada, Automate = orquestrador) sem virar um emaranhado.
- **Gradiente por aresta via `<linearGradient gradientUnits="userSpaceOnUse">`
  recalculado por frame**, não uma cor sólida "primary" de fallback: a pergunta do
  usuário dava as duas opções ("gradiente se der, se não, cor `primary` sólida") — o
  gradiente por posição real dos dois nodos (não `objectBoundingBox`, que sairia
  desalinhado com a direção real da linha conforme ela se move) funcionou de primeira,
  então não precisou do fallback.
- **`MAIN_RADIUS` subiu de 172 pra 190 e o conteúdo do dropzone ganhou uma variante
  menor abaixo do breakpoint `sm`**: só aumentar o raio (mais "área segura" em termos
  relativos) não bastava sozinho em telas estreitas, porque o texto de 3 linhas em
  `max-w-56` mantinha uma "área de conteúdo" grande o bastante pra ainda encostar nos
  nodos depois do reescalonamento pra ~390px de largura — só percebido testando em
  viewport mobile via Playwright (não era visível nos screenshots desktop usados pra
  validar o incremento anterior).
- **Cópia "fantasma" não recebe conexões nem `title`/label**: é puramente decorativa
  (`aria-hidden`), então não faz sentido ela competir por leitura de tela nem ganhar
  linhas que dobrariam o número de elementos SVG sem adicionar informação.

- `apps/web/src/components/nav/Navbar.tsx`: linha "Not afiliated with Microsoft" abaixo
  do wordmark — ajuste feito direto pelo usuário nesta mesma janela de trabalho, faz
  sentido junto deste incremento porque o orbit field agora usa várias marcas/PNGs de
  produtos Microsoft (Teams, Office 365, SharePoint, Power BI, Excel, Dataverse).

## Arquivos principais

- `apps/web/src/components/upload/{orbit-config.ts,OrbitField.tsx}`
- `apps/web/src/components/Dropzone.tsx`
- `apps/web/src/components/nav/Navbar.tsx`
