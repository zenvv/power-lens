# DAG de fluxo: condição do If, coleção do Foreach, ramos true/false separados

## O quê

- `packages/core`: o parser de flow agora extrai o que antes ficava só no `inputs` bruto
  e invisível na prática — `FlowNode.condition` (a expressão de um `If`, renderizada em
  texto legível a partir da árvore de operadores da Workflow Definition Language, ex.
  `{"and": [{"greater": [a, 1000]}]}` vira `a > 1000`) e `FlowNode.iterateOver` (a
  expressão `foreach` de um `Foreach`, com o prefixo `@` removido). Novo módulo
  `packages/core/src/parsers/flow/condition.ts` (`stringifyCondition`) faz a tradução;
  degrada honestamente pra `operador(args...)` quando o operador não é um dos
  documentados (`and`/`or`/`not`/`equals`/`strongEquals`/`greater`/`greaterOrEquals`/
  `less`/`lessOrEquals`).
- `apps/web`: o cabeçalho de um grupo `If`/`Foreach` no DAG mostra essa condição/coleção
  em vez do genérico "(If)"/"(Foreach)" (texto truncado, com tooltip pro valor
  completo). Os ramos `true`/`false` de um `If` (e os `cases`/`default` de um `Switch`)
  agora aparecem em contêineres visuais separados lado a lado — rotulados "Se sim"/"Se
  não" (ou o nome do case/"Caso padrão") — em vez de misturados na mesma caixa
  distinguidos só por uma pílula. `apps/web/src/lib/flow-layout.ts` cria esses
  contêineres como nós sintéticos do ELK (sem `FlowNode` correspondente no IR — só
  reagrupam visualmente o que `branch` já dizia) e os arranja perpendicular ao sentido
  geral do fluxo (colunas quando o fluxo desce, linhas quando vai pra direita), imitando
  o layout do Power Automate. Novo componente `FlowBranchNode.tsx` renderiza esse rótulo.
- A cor de início/fim (borda verde/rosa) deixou de pintar a caixa inteira de um grupo
  (`If`/`Foreach`/`Scope`/`Switch`) — só o bloco da action específica carrega essa cor
  agora, evitando o ruído de ver o mesmo "fim de ramo" pintado tanto na ação final quanto
  no contêiner inteiro em volta dela.

## Por quê

Pedido do usuário, a partir de screenshots do DAG: o bloco de `Condition` não mostrava
qual condição estava sendo avaliada, o `Foreach` não mostrava o que estava sendo
iterado, os dois ramos do `If` ficavam misturados na mesma caixa (diferente do Power
Automate, que separa visualmente), e os grupos vinham coloridos de verde/rosa mesmo não
sendo eles a action de início/fim de fato.

## Decisões

- `expression` (If) e `foreach` (Foreach) não têm evidência empírica num
  `definition.json` real deste projeto — só o schema publicamente documentado do
  Workflow Definition Language (mesma situação já registrada em
  `raw-shapes.ts`/`docs/FORMAT-NOTES.md` seção 4 pro resto do parser de flow). Seguido o
  precedente já estabelecido no arquivo: campos novos marcados `[LACUNA]`, degradação
  honesta em vez de lançar exceção quando a forma não bate.
  Confirmado via Microsoft Learn (`workflow-definition-language-schema`,
  `logic-apps-workflow-actions-triggers`) antes de implementar, pra não adivinhar às
  cegas: `If.expression` é objeto-em-árvore-de-operador ou string de expressão crua;
  `Foreach.foreach` é sempre string.
  Optei por não pausar pra perguntar (regra "pergunte em vez de supor" do CLAUDE.md) já
  que isso segue o padrão que o próprio parser de flow já adota pro resto do arquivo — a
  alternativa seria bloquear a feature inteira à espera de um `definition.json` real.
- `stringifyCondition` só reconhece os operadores documentados; qualquer outro (ex.
  `contains`, `startsWith`) vira `operador(args...)` em vez de tentar adivinhar um
  símbolo — evita afirmar uma tradução errada.
- Contêineres de ramo só aparecem pros branches que de fato têm ações na definição (um
  `If` sem `else` não ganha uma caixa "Se não" vazia fabricada).
- Grupos continuam não-selecionáveis (clique não abre o inspector) — a condição/coleção
  já fica visível direto no cabeçalho, então não valeu a pena mexer na seleção só por
  isso.
- Testado ao vivo no browser (Playwright) com um fluxo sintético `Foreach` → `If` →
  duas `SetVariable`, nas duas direções (de cima pra baixo e da esquerda pra direita).

## Arquivos principais

- `packages/core/src/parsers/flow/condition.ts` (novo)
- `packages/core/src/parsers/flow/raw-shapes.ts`, `actions.ts`
- `packages/core/src/ir/schema.ts` (`FlowNode.condition`, `FlowNode.iterateOver`)
- `apps/web/src/lib/flow-layout.ts` (contêineres de ramo sintéticos)
- `apps/web/src/components/flow/FlowBranchNode.tsx` (novo), `FlowNode.tsx`,
  `FlowDagView.tsx`
