# Fase 16 (UI) do plano de novas features: painel de lineage

## O quê

- `apps/web/src/components/mer/LineagePanel.tsx` (novo): mesmo estilo do
  `MeasuresPanel` (`ScrollArea` + cards), usando `buildLineageIndex(model,
  report)` do núcleo. Filtro rápido "Only unused" pra ver só coluna/medida
  sem uso em nenhum visual; card com uso lista página + título/tipo de cada
  visual que referencia aquela entrada. Sem `report` associado (a maioria
  dos modelos Dataverse), mostra aviso explícito em vez de listar tudo como
  "não usado" — não teria como saber.
- `lib/artifact-groups.ts`: `groupArtifactsByKind` ganhou `reports` (artefatos
  `kind: "report"`), pra `DocumentView` achar o `Report` do mesmo `.pbit`
  (casado pelo id `${dataModel.id}-report`, convenção já fixada na Fase 15).
- `DocumentView.tsx`: o painel lateral fixo da aba "Modelos de dados" (antes
  só `MeasuresPanel`) virou uma `Tabs` interna com duas abas, "Measures" e
  "Lineage" — mesmo espaço horizontal, sem competir com o diagrama MER.
- `lib/i18n/translations/{en,pt,es}.ts`: `mer.measuresTab`/`mer.lineageTab`
  e namespace `lineage` novo.

Fecha a Fase 16 da camada de UI — última peça do plano de 13 features
(núcleo pronto desde `2026-09-16-lineage-fase16-coluna-medida-visual.md`).

## Por quê

Terceira peça da sequência de UI — reusa quase tudo do `MeasuresPanel` já
existente, baixo risco.

## Decisões

- **Verificado ao vivo contra o `.pbit` real de referência**: "68 unused"
  bateu exatamente com a validação feita por script ao terminar a Fase 16
  do núcleo (89 entradas, 21 usadas, 68 não usadas); o toggle "Only unused"
  filtrou corretamente a lista pra mostrar só essas 68.
- **Match `Report` ↔ `DataModel` por convenção de id** (`${model.id}-report`),
  não um campo de relacionamento explícito no IR — é a mesma decisão já
  tomada (e única disponível) desde o parser da Fase 15; funciona porque um
  `.pbit` só produz no máximo um `DataModel` e um `Report`.
- **Aba interna (`Tabs`) em vez de um terceiro painel lado a lado** — a
  segunda opção cogitada no plano ("vira um terceiro painel") empurraria o
  diagrama MER pra fora da viewport em telas menores; abas ocupam o mesmo
  espaço que o `MeasuresPanel` já usava.

## Arquivos principais

- `apps/web/src/components/mer/LineagePanel.tsx` (novo)
- `apps/web/src/lib/artifact-groups.ts`, `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/lib/i18n/translations/{en,pt,es}.ts`
