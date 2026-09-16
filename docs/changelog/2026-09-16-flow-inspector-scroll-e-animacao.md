# Painel do bloco de fluxo: corrige scroll, adiciona slide-in e libera o canto superior direito

## O quê

- `apps/web/src/components/flow/FlowNodeInspector.tsx`: corrige o painel não rolar quando
  o conteúdo (grupos/campos de `inputs`) é mais alto que a viewport — o `ScrollArea` era
  filho `flex-1` de um container `flex-col h-full` sem `min-h-0`, então por causa do
  `min-height: auto` padrão do flexbox ele crescia pra caber o conteúdo em vez de
  encolher e rolar. Adiciona também uma animação de entrada (slide da direita +
  fade, via `tw-animate-css`) quando o painel abre.
- `apps/web/src/components/flow/FlowDagView.tsx`: os botões de direção do layout
  (cima-pra-baixo / esquerda-pra-direita) do `<Panel>` do React Flow saem de
  `top-right` pra `top-left` — no canto direito eles ficavam embaixo do painel do bloco
  (ambos absolutos no mesmo canto) quando um node era selecionado.

## Por quê

Usuário reportou, com print, que o painel não deixava rolar até o fim dos campos de
`inputs` de um bloco com muitos parâmetros, e pediu animação de entrada e realocação dos
botões de direção pra não sobrepor o painel.

## Decisões

- Fix é só o `min-h-0` no `ScrollArea` — não mexeu na estrutura do layout. Uma
  `className="overflow-scroll"` tinha sido adicionada à seção "Inputs" numa tentativa
  anterior de contornar o bug; removida porque não endereçava a causa raiz (a seção não
  tem altura própria delimitada, então `overflow-scroll` nela não fazia nada) e a correção
  no `ScrollArea` pai já resolve.
- Sem animação de saída: o painel é montado/desmontado condicionalmente (não usa Radix
  Presence), então só a entrada (`animate-in slide-in-from-right-4`) foi adicionada — pedido
  do usuário era só sobre a entrada.
- Testado ao vivo no browser (Playwright/Chromium) com viewport baixo (520px) pra forçar
  overflow: confirmado que o painel agora rola independente do restante da página e revela
  os campos que ficavam cortados (`ConnectionName`, `Parameters`, `Dataset`, `Table`), e que
  os botões de direção não ficam mais atrás do painel aberto.

## Arquivos principais

- `apps/web/src/components/flow/FlowNodeInspector.tsx`
- `apps/web/src/components/flow/FlowDagView.tsx`
