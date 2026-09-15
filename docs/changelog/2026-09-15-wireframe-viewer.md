# Wireframe: blueprint estático por tela (Fase 5)

## O quê

- `packages/core/src/render/wireframe/resolve-layout.ts`: resolve `X`/`Y`/`Width`/`Height`/
  `Text`/`Fill` de cada `Control` quando são literais ou aritmética constante (spec seção
  7). Inclui um avaliador de aritmética pequeno (tokenizer + parser por precedência, só
  números/`+ - * /`/parênteses) e um caso especial pra `RGBA(r,g,b,a)` com argumentos
  constantes, já que `Fill` é quase sempre escrito como fórmula mesmo pra cor fixa. Tudo o
  mais vira `{ status: "dynamic", raw }`; propriedade ausente vira `{ status: "absent" }`
  (estado separado — "não foi setada" e "tem fórmula que não conseguimos resolver" pedem
  tratamento visual diferente).
- `apps/web/src/components/wireframe/`: `WireframeView` (seletor de tela + canvas) e
  `ControlBox` (retângulo recursivo por controle). Rotulado "Wireframe" na UI, nunca
  "preview" (spec seção 7).
- `apps/web/src/lib/wireframe-canvas.ts`: tamanho do placeholder padrão, tamanho do canvas
  inferido da extensão dos filhos posicionados, e `hasDeclaredPosition`.
- 21 testes novos em `packages/core/test/render/wireframe.test.ts` cobrindo o avaliador de
  aritmética e a resolução de cada propriedade.

## Por quê

Fase 5 do roadmap — última peça determinística antes da camada de IA (Fase 6).

## Decisões

- **RGBA conta como "aritmética constante"**: a spec fala em "literais ou aritmética
  constante" pra Fill, mas no Studio real `Fill` é escrito como `=RGBA(255, 255, 255, 1)`
  mesmo pra uma cor totalmente fixa — sem tratar essa chamada específica como resolvível
  (quando os 4 argumentos são constantes), o wireframe nunca mostraria nenhuma cor de
  verdade. `Color.Xxx` (paleta nomeada) continua dinâmico — é um identificador, não
  aritmética.
- **Containers `AutoLayout` sem X/Y — corrigido depois de testar no browser**: a primeira
  versão posicionava todo controle sem posição resolvida em `(0,0)` absoluto. Testando
  contra o fixture `.msapp` real (que tem um `GroupContainer` `Variant: AutoLayout`, o
  padrão moderno do Studio, onde os filhos não têm X/Y no arquivo porque a posição é
  calculada em tempo de execução por um layout flex), isso fez os controles empilharem
  exatamente um em cima do outro — ilegível. Corrigido: um controle sem X *e* Y declarados
  (`hasDeclaredPosition` retorna falso) renderiza em fluxo normal (empilhado verticalmente
  pelo próprio CSS) em vez de absoluto forçado; só quem declara alguma posição (resolvida
  ou dinâmica) vira uma caixa `position: absolute`. Isso não teria aparecido rodando só
  `pnpm typecheck`/`pnpm test` — só apareceu ao carregar o app de verdade num browser
  (Playwright/Chromium) e olhar o resultado, de novo confirmando a instrução do projeto de
  verificar UI ao vivo antes de considerar pronto.
- **Tamanho do canvas inferido, não fixo**: em vez de chutar um tamanho de tela padrão
  (phone/tablet/desktop), o canvas é dimensionado pela extensão dos filhos diretos
  *posicionados* da tela, com um piso mínimo — filhos em fluxo normal não entram nessa
  conta (o navegador já os acomoda).

## Arquivos principais

- `packages/core/src/render/wireframe/{resolve-layout,index}.ts`
- `packages/core/src/render/index.ts`, `packages/core/src/index.ts`
- `apps/web/src/components/wireframe/{WireframeView,ControlBox}.tsx`
- `apps/web/src/lib/wireframe-canvas.ts`
- `apps/web/src/components/DocumentView.tsx`
- `packages/core/test/render/wireframe.test.ts`
