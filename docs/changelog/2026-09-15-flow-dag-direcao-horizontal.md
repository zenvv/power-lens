# Toggle de direção (cima-baixo / esquerda-direita) no viewer de fluxo

## O quê

`FlowDagView` ganhou um controle (canto superior direito, ícones de seta) pra alternar
o sentido do DAG entre "de cima pra baixo" (padrão, como já era) e "da esquerda pra
direita". `layoutFlow` (`apps/web/src/lib/flow-layout.ts`) recebe um terceiro parâmetro
opcional `direction: "DOWN" | "RIGHT"` (default `"DOWN"`, mesmo comportamento de antes
pra quem já chamava com 2 argumentos) e repassa direto pro `elk.direction` do ELK, que
já suporta os dois sentidos nativamente — não precisou de lógica de layout nova. O
`FlowNode` também troca os handles de conexão de Top/Bottom pra Left/Right quando
horizontal, senão as setas saem do lado errado do bloco.

De brinde: o viewer agora recentraliza (`fitView`) sozinho depois de qualquer mudança
de layout (trocar direção, colapsar/expandir grupo) — antes só recentralizava na
carga inicial, então trocar de direção podia cortar nós fora da área visível.

## Por quê

Pedido do usuário: preferia poder alternar entre os dois sentidos de leitura do fluxo.
Também perguntou se o viewer de fluxo/MER usa `react-flow` — confirmado que sim
(`@xyflow/react`, o nome atual do pacote) já era usado nos dois (`FlowDagView.tsx` e
`MerView.tsx`), nenhuma migração necessária.

## Decisões

- Direção guardada como estado da UI (`useState`), não persistida — reabrir o arquivo
  volta pro padrão "de cima pra baixo". Não foi pedido persistência, e o app não tem
  hoje nenhum mecanismo de preferência salva entre sessões.
- `groupLayoutOptions` virou função de `direction` em vez de constante — o padding do
  cabeçalho do grupo continua sempre reservado no topo (`top: GROUP_HEADER_HEIGHT+16`),
  independente do sentido de fluxo dos filhos, porque o cabeçalho (chevron + nome) do
  próprio `FlowNode` nunca muda de posição dentro da caixa.

## Arquivos principais

- `apps/web/src/lib/flow-layout.ts` — `FlowDirection`, `groupLayoutOptions(direction)`,
  `direction` passado através de `FlowRfNodeData`.
- `apps/web/src/components/flow/FlowNode.tsx` — handles Top/Bottom vs Left/Right.
- `apps/web/src/components/flow/FlowDagView.tsx` — toggle (`Panel` do
  `@xyflow/react`), `fitView` após mudança de layout.
- `apps/web/test/flow-layout.test.ts`.
