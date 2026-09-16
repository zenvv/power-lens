# Resumo: ícones Fluent coloridos, ilustrações 3D e wallpaper decorativo

## O quê

- `apps/web/src/components/document/StatTile.tsx`: cada card de métrica do Resumo agora
  recebe um ícone (prop `icon`), usando os ícones "Color" do `@fluentui/react-icons`
  (multi-color, já usados em outros pontos do app). Superfície do card virou vidro fosco
  (`bg-card/60` + `backdrop-blur-xl`) pra deixar o wallpaper por trás passar.
- `apps/web/src/components/DocumentView.tsx`: os 5 `StatTile` do Resumo ganharam ícone
  (artefatos → `PuzzlePieceColor`, fluxos → `CloudColor`, modelos de dados →
  `DatabaseColor`, canvas apps → `PhoneLaptopColor`, diagnósticos → `WarningColor`). Os
  cards "Exportar" e "Explicação por IA" ganharam uma ilustração 3D grande ao lado
  (pasta aberta e robô, respectivamente — ver "Decisões") sobre uma superfície também em
  vidro fosco, com um wash de gradiente radial (âmbar/violeta) localizado por trás de
  cada uma. A seção "Resumo" inteira ganhou um wallpaper decorativo (blobs coloridos
  desfocados — verde/azul/violeta/âmbar, paleta padrão do Tailwind, puramente
  decorativa) atrás de todo o conteúdo, contido num wrapper de altura natural (não o
  painel inteiro, que é mais alto que o conteúdo).
- 2 arquivos de imagem novos em `apps/web/src/assets/illustrations/`
  (`open-file-folder-3d.png`, `robot-3d.png`).
- `StatTile`: removida a classe `capitalize` do rótulo — ela quebrava rótulos com
  parênteses (`artefato(s)` virava `Artefato(S)`, já que `(` conta como início de
  palavra pro CSS `text-transform: capitalize`).

## Por quê

Pedido do usuário: dar mais vida visual à página de Resumo — ícones coloridos em cada
card (o app já tem acesso à biblioteca de ícones "Color" do Fluent UI), e uma imagem/
gradiente decorativo nos cards de Exportar e Explicação por IA, no estilo
glassmorphism/neomorfismo colorido que a Microsoft tem usado (referências: grade de
ícones 3D do Fluent, banner do Excel, hero do Adaptive Cards). Também pediu um fundo
mais elaborado, com gradientes, pra página em geral.

## Decisões

- **Ilustrações 3D vieram do repositório oficial `microsoft/fluentui-emoji` (MIT),
  baixadas e bundladas localmente** (`Open file folder` e `Robot`, variante `3D`), não
  linkadas por URL — mantém o princípio de client-side/offline (spec seção 3): a app não
  depende de rede pra renderizar sua própria UI, só pro parsing é que isso já valia.
  Ícones pequenos (stat tiles) continuam vetoriais (`@fluentui/react-icons`, variante
  "Color") em vez de usar as mesmas imagens 3D em tamanho reduzido — nitidez em ~20px
  importa mais que consistência de estilo entre tamanhos tão diferentes.
- **Cores do wallpaper e dos washes dos cards são decorativas, não os tokens de marca**
  (`--sidebar-primary` etc., que só cobrem a escala de verde). O objetivo aqui era
  literalmente introduzir uma paleta multicor nessa página específica — usar só verde
  não atenderia o pedido. Ainda assim ficou restrito a esta seção (Resumo), não ao app
  inteiro.
- **Bug de stacking context com `z-index` negativo**: o wallpaper (`-z-10`) inicialmente
  não aparecia de jeito nenhum, mesmo com todos os estilos computados corretos (cor,
  blur, posição) — porque o wrapper `relative` que o contém não tem `z-index` próprio,
  então não cria um stacking context isolado; o filho de `z-index: -10` "escapava" pro
  stacking context mais próximo acima (bem mais alto na árvore), acabando desenhado
  atrás do painel branco (`bg-background`) inteiro em vez de só atrás dos irmãos aqui
  dentro. Fix: `isolate` (CSS `isolation: isolate`) no wrapper, criando um stacking
  context próprio sem precisar de `z-index` explícito nele.
- **Blobs sem offset negativo**: o painel que envolve o conteúdo rola com
  `overflow-y-auto`, o que (por regra do CSS: um eixo `visible` e o outro não-`visible`
  força os dois a virarem não-`visible`) também recorta o eixo X — qualquer blob
  posicionado fora do próprio wrapper (`-top-28`, por exemplo) seria cortado. Os 4 blobs
  ficam contidos dentro do wrapper (`inset-0`), só com posições dentro dos 4 cantos.

## Arquivos principais

- `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/components/document/StatTile.tsx`
- `apps/web/src/assets/illustrations/{open-file-folder-3d.png,robot-3d.png}`
