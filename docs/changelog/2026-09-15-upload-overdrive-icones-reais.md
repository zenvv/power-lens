# Orbit field: logos reais, cores extraídas dos ícones, galhos aleatórios

## O quê

- `apps/web/src/assets/orbit-icons/{powerapps,powerautomate}.webp` (novos): logos
  oficiais de Power Apps e Power Automate, fornecidos pelo usuário. Substituem os
  ícones genéricos `AppsColor`/`ArrowClockwiseDashesColor` do Fluent que esses dois
  nodos usavam antes.
- `apps/web/src/components/upload/orbit-config.ts`: todos os 10 `tint` recalculados a
  partir da cor real de cada ícone (script descartável com `sharp`, ver Decisões) em
  vez de aproximações de marca escolhidas de memória — inclusive corrigiu um erro:
  Dataverse é verde (não azul, como eu tinha assumido no incremento anterior).
  Adiciona `GHOST_NODES`/`GHOST_EDGES`: 18 nodos-fantasma com posição, raio, tamanho,
  opacidade e ícone (sorteado entre os 10 reais) aleatórios via PRNG com seed fixa
  (`mulberry32`), mais um punhado de conexões esparsas só entre eles.
- `apps/web/src/components/upload/OrbitField.tsx`: linhas de conexão do anel
  principal e dos fantasmas passam a ser sólidas (`strokeDasharray` removido). A
  camada de profundidade deixa de espelhar 1:1 os 10 nodos reais (mesmo ângulo,
  raio fixo) e passa a ser desenhada a partir de `GHOST_NODES`/`GHOST_EDGES` — posição,
  tamanho e ícone de cada fantasma são independentes dos nodos reais.
- `apps/web/src/components/HomeSection.tsx`: gradiente radial (`var(--background)` no
  centro, transparente na borda) atrás do ícone+texto do dropzone, pra manter
  legibilidade agora que o anel tem mais nodos e linhas mais visíveis (sólidas,
  coloridas) por perto.

## Por quê

Feedback do usuário depois de ver a versão com 10 nodos: os logos de Power Apps e
Power Automate eram genéricos demais (ele forneceu os SVGs/PNGs oficiais pra
substituir), as cores dos nodos pareciam arbitrárias em vez de vir de cada ícone, as
linhas pontilhadas deviam virar sólidas, a camada "fantasma" devia ser posicionada de
forma aleatória (não espelhando a posição/ordem dos nodos reais) e podia ter mais
nodos e até conexões próprias ("como se fossem galhos"), e o texto do dropzone
precisava de mais contraste contra o campo de nodos atrás dele.

## Decisões

- **Cor extraída por script, não escolhida de memória**: escrevi um script Node
  descartável (`sharp`, instalado só no scratchpad da sessão) que abre cada PNG/WebP,
  ignora pixels quase transparentes e faz uma média das cores ponderada pela
  saturação (pixels mais vívidos pesam mais que branco/cinza de fundo), depois
  converte pra OKLCH com a matriz padrão do Björn Ottosson (a mesma usada pela CSS
  Color 4). Pros dois ícones Fluent sem asset raster (`GlobeColor` do Power Pages,
  `MoleculeColor` do Power Platform) renderizei o SVG via `renderToStaticMarkup` e
  peguei a cor do maior *shape* (o círculo/gradiente principal), já que não dá pra
  rasterizar um componente React com `sharp` diretamente. Percebi no processo que a
  extração da versão anterior estava errada pro Dataverse (assumi azul; a imagem
  real é verde) — corrigido.
- **Três nodos (Power Automate, Power Pages, Microsoft 365) deram tons de azul bem
  próximos** depois da extração — mantive assim mesmo, porque o pedido explícito era
  "cor predominante de cada ícone, não cores aleatórias": se três ícones realmente
  são azulados, forçar uma paleta artificialmente mais distinta seria voltar a
  escolher cor de memória, o problema original.
- **Fantasmas com PRNG de seed fixa (`mulberry32(20260915)`), não `Math.random()`**:
  precisa ser determinístico entre remontagens do componente (o usuário troca de
  arquivo, volta pra tela de upload, o `OrbitField` desmonta/remonta) sem introduzir
  estado externo pra persistir posições — uma seed fixa dá o efeito "espalhado" que
  foi pedido sem ficar recalculando aleatoriedade nova a cada vez.
- **Gradiente radial dimensionado em `%` do container, não em px sincronizado com
  `MAIN_RADIUS`**: como o raio dos nodos é calculado em JS (px de referência ×
  escala do container), sincronizar um retângulo CSS a isso exigiria ler o mesmo
  `scaleRef` de dentro do `HomeSection` (que não tem acesso a ele — é interno ao
  `OrbitField`). Um `width: 70%` com `radial-gradient` em porcentagem escala junto
  com o wrapper automaticamente, sem precisar coordenar os dois componentes.

## Arquivos principais

- `apps/web/src/assets/orbit-icons/{powerapps,powerautomate}.webp`
- `apps/web/src/components/upload/{orbit-config.ts,OrbitField.tsx}`
- `apps/web/src/components/HomeSection.tsx`
