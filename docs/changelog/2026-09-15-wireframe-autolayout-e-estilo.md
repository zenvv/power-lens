# Wireframe resolve AutoLayout, Parent.Width/Height e propriedades de estilo

## O quê

`resolveControlLayout`/`ControlBox` (o renderer de tela do canvas app) ganharam:

1. **Resolução de `Parent.Width`/`Parent.Height`** — antes só aritmética puramente
   numérica resolvia (`40 + 20`); `Width: =Parent.Width` (o padrão em praticamente todo
   container real — `docs/FORMAT-NOTES.md` seção 1.4) virava sempre "dynamic" e caía num
   placeholder pequeno. Agora `resolveControlLayout` recebe um `LayoutContext` com o
   tamanho do pai e o substitui antes de avaliar a aritmética — propagado
   recursivamente: cada control resolvido vira o `Parent.Width/Height` dos próprios
   filhos.
2. **Viewport padrão fixo** (`DEFAULT_CANVAS_WIDTH`/`HEIGHT`, 1366×768, formato tablet
   mais comum do Studio) semeia esse contexto na raiz — nada no IR guarda o tamanho real
   do app hoje (`App.pa.yaml` nunca foi inspecionado pra isso).
3. **Simulação de `Variant: AutoLayout`** como flexbox: `LayoutDirection`, `LayoutGap`,
   `LayoutAlignItems`, `LayoutJustifyContent`, `Padding{Top,Right,Bottom,Left}`
   resolvidos e aplicados via CSS `display: flex` em vez de forçar posição absoluta ou
   empilhamento genérico.
4. **Propriedades de estilo** que o `Control.properties` do IR já carregava mas o
   renderer nunca lia: `BorderColor`/`BorderThickness`/`BorderStyle`, `Color` (texto),
   `Size` (fonte), `Bold`, `Visible` (controle com `Visible: false` resolvido some do
   wireframe).
5. IR: `Control.variant` (captura o `Variant:` do YAML, ex. `"AutoLayout"` — antes
   descartado no parser do `.msapp`).

## Por quê

Pedido do usuário: testou o wireframe com um app real e viu tamanho/posição/cor/borda
errados. Investigação mostrou duas causas raiz: (1) o resolver só entendia aritmética
pura, e (2) o renderer nunca lia metade das propriedades que o parser já capturava.

## Decisões

- **Perguntei ao usuário duas coisas antes de mexer**, já que envolvem estrutura de
  arquivo não confirmada (regra do CLAUDE.md — suposição errada custa mais caro que
  perguntar):
  - Priorizar simular o AutoLayout (mais trabalho, mais fiel) em vez de só consertar
    borda/cor mantendo o fallback de placeholder pro Parent.Width → escolhido simular
    AutoLayout.
  - Tamanho de canvas: viewport fixo (1366×768) vs. parsear `App.pa.yaml` de verdade →
    escolhido viewport fixo por enquanto.
- **Nomes de propriedade do AutoLayout são inferidos**, não confirmados contra um
  `.msapp` real — `FORMAT-NOTES.md` só confirma `BorderStyle`/`Width: =Parent.Width`
  nesse container. Um nome errado degrada pro default do CSS (não quebra nada, só não
  aplica aquele efeito específico) — sinalizado como suposição, não fato, no comentário
  do código.
- **`Parent.Width`/`Height` só propaga quando o próprio control resolveu um valor
  concreto ou simplesmente não declarou a propriedade** (`status: "absent"` — a maioria
  dos containers/telas nunca declara Width). Quando a propriedade existe mas é uma
  fórmula que não dá pra resolver (`status: "dynamic"`), os filhos que dependem dela
  também ficam "dynamic" em vez de herdar um número adivinhado do avô.
- **`computeCanvasSize`/`extent` (heurística antiga de inferir tamanho de tela pela
  extensão dos filhos posicionados) foi removida** — substituída pelo viewport fixo,
  código morto depois da troca.
- **Limitação conhecida, não corrigida**: uma tela pode misturar um filho com X/Y
  absoluto declarado e um container `AutoLayout` sem X/Y como irmãos diretos — nesse
  caso as duas caixas competem pelo mesmo espaço no topo (visto no fixture sintético:
  `NavBar1` tem `X: =0, Y: =0` literal, irmão de `HeaderContainer` que não declara
  posição nenhuma). Isso reflete fielmente o dado do arquivo; não inventei uma
  heurística pra "ignorar" X/Y vestigial de um filho de tela porque não há evidência de
  quando isso é intencional vs. lixo de export.

## Arquivos principais

- `packages/core/src/ir/schema.ts` — `Control.variant`.
- `packages/core/src/parsers/msapp/controls.ts` — captura `Variant`.
- `packages/core/src/render/wireframe/resolve-layout.ts` — `LayoutContext`,
  `DEFAULT_CANVAS_WIDTH/HEIGHT`, `resolveEnumMember`, campos novos em `ResolvedControl`.
- `packages/core/test/render/wireframe.test.ts`,
  `packages/core/test/parsers/msapp.test.ts`.
- `apps/web/src/components/wireframe/{ControlBox,WireframeView}.tsx`,
  `apps/web/src/lib/wireframe-canvas.ts`.
