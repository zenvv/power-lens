# Fase 16 do plano de novas features: lineage coluna/medida → visual

## O quê

`packages/core/src/analysis/build-lineage-index.ts`: `buildLineageIndex(dataModel,
report)` cruza um `DataModel` com o `Report` do mesmo documento (Fase 15) e
devolve uma entrada por coluna/medida (`{ table, name, kind, visuals: [] }`),
listando cada visual (`{ pageName, visualType, visualTitle? }`) que a
referencia. Entrada com `visuals: []` = não aparece em nenhum visual deste
relatório — sem `report` (nenhum `Report/Layout` associado), toda entrada
volta assim, honestamente ("sem como saber", não "não usada").

Igual às demais fases do plano, cobre só `packages/core` — o painel de UI
(`LineagePanel.tsx` na aba "Modelos de dados") fica pra quando o redesenho
em andamento em `apps/web` estabilizar.

## Por quê

Fase 16, última do plano de 13 features — dependia da Fase 15
(`Report/Layout`) pra ter o que cruzar.

## Decisões

- **Validado contra o `.pbit` real de referência**, não só a fixture
  sintética: das 89 colunas/medidas do modelo, 21 apareceram em algum
  visual e 68 não. As 3 medidas do arquivo real (`AGUARDANDO`, `ANDAMENTO`,
  `PARADO`) foram corretamente casadas com o cartão que as usa — a suposição
  inicial ("medida referenciada em visual nunca confirmada, extrapolada por
  simetria com coluna") caiu: o campo do visual usa exatamente
  `"GANTT.ANDAMENTO"`, a mesma convenção `Tabela.Nome` de uma coluna, e o
  parser cruzou certo sem precisar de tratamento especial pra medida.
- **Match por `Tabela.Nome` (com ou sem `Funcao(...)` de agregação em
  volta)**, sem distinguir coluna de medida na hora de casar — ambas vivem
  no mesmo mapa `"tabela.nome" → entrada`, e o `kind` já vem de onde a
  entrada foi criada (`DataModel.tables[].columns` vs
  `DataModel.measures`). Mais simples do que ter dois caminhos de match.
- **Campo sem tabela (`"Amount"`, sem ponto) é ignorado**, não tratado como
  match por nome bruto — nenhuma evidência desse formato aparecer de
  verdade (todos os 23 campos distintos do arquivo real tinham o
  qualificador de tabela), então tratar como coluna certa seria supor sem
  base.

## Arquivos principais

- `packages/core/src/analysis/build-lineage-index.ts`, `analysis/index.ts`
- `packages/core/src/index.ts` (export)
- `packages/core/test/analysis/build-lineage-index.test.ts`
