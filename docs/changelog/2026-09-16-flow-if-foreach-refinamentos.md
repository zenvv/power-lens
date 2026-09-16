# DAG de fluxo: refinamentos no bloco de If/Foreach a partir de feedback visual

## O quê

- Rótulo de branch de um `If` volta a ser o valor cru da definição (`true`/`false`),
  não mais "Se sim"/"Se não" — o texto traduzido confundia mais do que ajudava, já que
  é literalmente o valor que aparece no `definition.json`. Removidas as chaves
  `flow.branch.ifTrue`/`ifFalse` dos três locales; `flow.branch.defaultCase` (Switch)
  continua traduzido, por ser texto natural de fato.
- O bloco de condição (If) / coleção iterada (Foreach) agora fica **abaixo** do
  cabeçalho do grupo, não mais ao lado truncado numa linha só — um bloco de texto
  monoespaçado próprio, com até 2 linhas (`line-clamp-2`) e tooltip pro que não couber.
- Um `If` sempre desenha os dois branch containers, `true` e `false`, mesmo que um dos
  dois não tenha nenhuma action na definição (sem `else`, por exemplo) — o lado vazio
  vira um placeholder pontilhado com o texto "Vazio"/"Empty". Cabeçalho do branch
  `true` fica verde, `false` fica vermelho (só o cabeçalho, a caixa em si continua
  neutra pontilhada).
- Início (gatilho) e fim de fluxo deixaram de usar cor (verde/vermelho) — a cor
  competia visualmente com a cor de categoria da action e confundia com o
  verde/vermelho novo dos branches. Agora é só forma: gatilho fica com cantos retos
  (`rounded-none`), fim vira uma cápsula (`rounded-full`) — ambos sem cor, iguais a
  qualquer outro bloco fora isso.
- Grupos (`If`/`Foreach`/`Scope`/`Switch`) ganharam largura mínima maior
  (`elk.nodeSize.minimum`/`constraints` no ELK) pra sobrar espaço horizontal pro bloco
  de condição/coleção quebrar em poucas linhas.

## Por quê

Feedback direto do usuário depois de ver o resultado do incremento anterior
(`2026-09-16-flow-if-foreach-branches.md`): "Se sim" ficou estranho (queria o valor
cru), a condição deveria ficar embaixo do cabeçalho — não do lado —, os dois branches
deveriam sempre aparecer mesmo vazios, o cabeçalho de cada lado deveria ser
verde/vermelho, e a cor de início/fim deveria sumir (virar só forma) pra não confundir
com a cor nova dos branches.

## Decisões

- **Bug descoberto ao verificar visualmente**: a primeira tentativa de arranjar os
  branch containers lado a lado usava `elk.direction` invertido nos filhos do
  contêiner ("RIGHT" quando o fluxo geral é "DOWN"). Isso não fazia efeito nenhum na
  prática — os dois containers de branch nunca têm aresta entre si (um `true` não roda
  depois de um `false`), então o ELK os tratava como "componentes desconectados" e os
  empilhava verticalmente com seu empacotador default, ignorando `elk.direction`
  completamente, nas duas direções. Corrigido desligando
  `elk.separateConnectedComponents` nesse nó específico (assim os dois containers
  entram no algoritmo `layered` normal, caem na mesma camada por não terem aresta
  entre si, e nós de uma mesma camada se arranjam perpendicular ao `elk.direction` —
  que passou a ser o mesmo sentido geral do fluxo, não mais invertido). Verificado ao
  vivo no browser nas duas direções (`DOWN`: branches lado a lado; `RIGHT`: branches
  empilhados) depois da correção.
- Switch continua sem fabricar case vazio: `flattenActions` não guarda os nomes dos
  cases que não têm nenhuma action, então não tem como desenhar um placeholder com o
  nome certo — só o `true`/`false` de um If, que são sempre os dois únicos valores
  possíveis, ganhou esse tratamento.
- Testado ao vivo no browser (Playwright) nos dois temas (claro/escuro), nas duas
  direções, e com um fluxo com `If` sem `else` pra conferir o placeholder vazio.

## Arquivos principais

- `apps/web/src/lib/flow-layout.ts` (fix de layout dos branches, largura mínima,
  `isEmpty`)
- `apps/web/src/components/flow/FlowBranchNode.tsx` (rótulo cru, cor verde/vermelho,
  placeholder vazio)
- `apps/web/src/components/flow/FlowNode.tsx` (bloco de condição abaixo do cabeçalho,
  forma em vez de cor pro início/fim)
- `apps/web/src/lib/i18n/translations/{en,es,pt}.ts`
