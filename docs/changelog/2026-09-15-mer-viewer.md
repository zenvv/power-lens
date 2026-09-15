# Viewer MER: diagrama de tabelas/relacionamentos + painel de medidas

## O quê

- `MerView` (`apps/web/src/components/mer/MerView.tsx`): diagrama do `DataModel` usando
  `@xyflow/react`, no mesmo padrão do `FlowDagView` já existente pro Cloud Flow — tabelas
  como nós, relacionamentos como arestas.
- `TableNode`: nó de tabela com cabeçalho clicável (recolhe/expande a lista de colunas),
  ícone de tabela oculta (`isHidden`) e ícone Σ em coluna calculada.
- `mer-layout.ts`: layout automático via `elkjs` (mesma engine do flow DAG) + notação de
  cardinalidade na aresta ("1 : *", "1 : 1", "* : *"), seta indicando o sentido da
  filtragem cruzada (dupla quando `crossFilter: "both"`) e traço tracejado pra
  relacionamento inativo.
- `mer-positions.ts`: posição de cada tabela arrastada manualmente persiste em
  `localStorage` por `model.id` (spec seção 7).
- `MeasuresPanel`: painel lateral com as medidas do modelo (fórmula DAX + format string),
  já que uma medida pertence a uma tabela mas não faz sentido como nó no diagrama.
- Wiring em `DocumentView.tsx`: um card "Modelo de dados" por artefato `dataModel`,
  diagrama + painel lado a lado.
- Testes em `apps/web/test/mer-layout.test.ts` (4 casos) usando a fixture
  `pbit-minimal` já existente.

## Por quê

Sequência natural da Fase 3 depois do parser de `.pbit` (`2026-09-15-pbit-data-model-parser.md`):
o parser já produzia o `DataModel`, mas não havia nenhuma forma de visualizá-lo — só a
tabela Markdown do doc export.

## Decisões

- **Direção da aresta normalizada**: o TMSL não garante que `from`/`to` de um
  relacionamento correspondam a "lado 1"/"lado muitos" — `manyToOne` tem `from` do lado
  muitos. `relationshipEdgeShape` em `mer-layout.ts` sempre desenha a aresta fluindo do
  lado "1" pro lado "muitos" (o sentido natural de filtragem num schema estrela:
  dimensão -> fato), senão o diagrama ficaria com setas apontando ora pra um lado ora
  pro outro sem motivo aparente.
- **Handles múltiplos por tabela**: testado no browser com a fixture sintética (que tem
  duas relações entre as mesmas duas tabelas) e as arestas ficaram exatamente sobrepostas
  — indistinguível mesmo com uma delas tracejada. Corrigido dando a cada `TableNode` 3
  handles por lado (`HANDLE_SLOT_COUNT`); `assignHandleSlots` atribui um handle diferente
  pra cada relacionamento extra entre o mesmo par de tabelas. Esse caso não é hipotético:
  é o formato comum de uma tabela de fatos com duas colunas de data (ex. `OrderDate` e
  `ShipDate`) apontando pra uma mesma dimensão de calendário compartilhada.
- **Verificação visual**: a instrução do projeto de rodar a UI num browser antes de dar
  por concluído (não só typecheck/teste) foi o que pegou o bug de sobreposição de aresta
  acima — passou no `pnpm typecheck`/`pnpm test` sem denunciar nada, só apareceu ao
  carregar o app de verdade num Chromium headless via Playwright e olhar o resultado.
- **Escopo**: só a visualização do `DataModel` que o parser de `.pbit` já produz. Nenhuma
  mudança no parser ou no IR neste incremento.

## Arquivos principais

- `apps/web/src/components/mer/{MerView,TableNode,MeasuresPanel}.tsx`
- `apps/web/src/lib/{mer-layout,mer-positions}.ts`
- `apps/web/src/components/DocumentView.tsx`
- `apps/web/test/mer-layout.test.ts`
