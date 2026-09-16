# Fase 15 do plano de novas features: parser de Report/Layout do Power BI

## O quê

- `packages/core/src/parsers/powerbi/report.ts`: `parseReportLayout` lê
  `Report/Layout` (UTF-16LE, mesmo `readUtf16LEText` já usado pro
  `DataModelSchema`) e produz um artefato `Report` — páginas (`sections`,
  ordenadas por `ordinal`) com seus visuais (`visualContainers`), cada um
  com `type` (`visualType`), `title` (quando setado) e `fields` (nomes de
  coluna/medida do `prototypeQuery.Select`, no formato `Tabela.Coluna` que
  já bate com o nome usado no `DataModel`).
- `parsePbit` agora também tenta ler `Report/Layout` depois do
  `DataModelSchema` e anexa o `Report` como um segundo artefato quando
  presente e válido — `DataModel` continua valendo mesmo se isso falhar.
- Fixture nova `fixtures/synthetic/pbit-minimal/ReportLayout.json` (2
  páginas, um visual com título e campos, um container de agrupamento a ser
  ignorado, um visual sem título) + 10 testes novos.
- `docs/FORMAT-NOTES.md` não precisou de nova seção de lacuna: a estrutura
  foi confirmada direto contra `reference/pbi-file-example.pbit` (o mesmo
  arquivo real já usado na Fase 3/`DataModelSchema`, gitignored).

## Por quê

Fase 15 do plano de 13 features — pré-requisito da Fase 16 (lineage
coluna→medida→visual). A spec já previa o artefato `Report` no IR desde o
rascunho original, mas nenhum parser o populava (decisão explícita da Fase 3:
"`Report/Layout` fica para um incremento futuro",
`docs/changelog/2026-09-15-pbit-data-model-parser.md`).

## Decisões

- **Validado contra o arquivo `.pbit` real antes de considerar pronto**
  (mesma disciplina da Fase 3): 4 páginas, 68 `visualContainers`, dos quais
  61 viraram `Visual` e 7 foram descartados por serem grupo decorativo —
  zero diagnóstico de erro/aviso, confirmando o parser na prática, não só
  contra a fixture sintética.
- **`config` de cada `visualContainer` é uma STRING JSON**, não um objeto
  direto — precisa de um segundo `JSON.parse`. Descoberto inspecionando o
  arquivo real antes de escrever qualquer schema/tipo.
- **Container de agrupamento (`singleVisualGroup`) não vira `Visual`.** É
  uma caixa decorativa sem `fields`/dado por trás (7 dos 68 containers do
  arquivo real são isso) — incluir geraria um "visual" vazio e sem sentido
  na documentação/lineage.
- **`title` extraído com uma extrapolação assumida como tal**: o valor de
  `objects.title[0].properties.text.expr.Literal.Value` vem como string DAX
  entre aspas simples (convenção documentada do formato); a remoção das
  aspas externas é aplicada, mas nenhum visual do arquivo real de referência
  tinha título setado pra confirmar contra um caso de verdade — sinalizado
  como extrapolação no comentário do código, não uma suposição escondida.
- **`Report.id` derivado do id do `DataModel`** (`${dataModel.id}-report`),
  não um id independente — um `.pbit` tem exatamente um relatório por
  arquivo, e reusar a raiz do id do modelo evita inventar outra convenção de
  nomeação só pra isso.

## Arquivos principais

- `packages/core/src/parsers/powerbi/report.ts` (novo)
- `packages/core/src/parsers/powerbi/{raw-shapes,parse}.ts`
- `fixtures/synthetic/pbit-minimal/ReportLayout.json`
- `packages/core/test/parsers/pbit.test.ts`
