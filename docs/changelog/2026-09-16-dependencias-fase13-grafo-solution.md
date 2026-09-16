# Fase 13 do plano de novas features: grafo de dependência entre artefatos

## O quê

- `packages/core/src/ir/schema.ts`: novo campo `PowerLensDocument.dependencies:
  DependencyEdge[]` (default `[]`), irmão de `artifacts`/`diagnostics`.
  `DependencyEdge = { fromArtifactId, from: { kind, name }, toArtifactId,
  toKind, toName, confidence: "exact" | "heuristic" }`.
- `packages/core/src/parsers/solution/link-dependencies.ts`: roda no fim de
  `parseSolution`, depois que todos os artefatos já foram montados (mesmo
  motivo de `runHealthChecks` rodar pós-parse). Dois tipos de vínculo:
  1. `CanvasApp.dataSources[]` ↔ `DataModel.tables[]` (Dataverse) por nome
     — exato (case-insensitive) vira `confidence: "exact"`, um nome contido
     no outro vira `"heuristic"`.
  2. `CloudFlow` → `CloudFlow` — ação `type: "Workflow"` (Executar um Fluxo
     Filho) referenciando outro fluxo da mesma solution via
     `inputs.host.workflow.id`. Referência que não resolve pra nenhum outro
     fluxo do documento vira diagnóstico **PL310** (info), não uma aresta
     inventada.
- `docs/FORMAT-NOTES.md` seção 4, itens 16/17: as duas suposições novas
  (shape da ação de fluxo filho; convenção de nome datasource↔tabela)
  documentadas como lacuna, não como fato confirmado.

Este incremento cobre só `packages/core` — o renderer do grafo
(`DependencyGraphView.tsx`, nova seção na sidebar) fica pra quando o
redesenho em andamento em `apps/web` estabilizar, igual às Fases 8/9/10/11.

## Por quê

Fase 13 do plano de 13 features — a peça arquiteturalmente mais nova da
lista: uma solution já produz múltiplos artefatos no mesmo documento, mas
nada cruzava um com o outro antes deste incremento.

## Decisões

- **Resolvido no parse, não com join solto por string em cada renderer.**
  Regra de arquitetura 2 do `CLAUDE.md` ("se falta um dado, o IR cresce")
  se aplica aqui: o match é heurístico e só tem a informação bruta
  necessária disponível durante o parse da solution — resolver uma vez,
  aqui, com confiança anotada e diagnóstico quando falha, é mais correto e
  mais barato do que reimplementar a mesma extração em cada renderer/regra
  futura que precisar cruzar artefatos.
- **Escopo do vínculo fluxo→fluxo decidido com o usuário**: perguntei se
  deveria cortar esse vínculo do escopo (zero evidência da forma real da
  ação "Executar um Fluxo Filho" — o parser de flow inteiro já é
  não-verificado) ou implementar best-effort a partir do schema público do
  Workflow Definition Language, documentando como lacuna. Resposta: seguir
  best-effort — mesmo padrão já usado pro parser de `.pbit` (defaults de
  relacionamento tirados da doc oficial, marcados `[LACUNA]` até um arquivo
  real aparecer).
- **`toArtifactId`/aresta só é criada quando o alvo é de fato encontrado no
  documento.** Uma referência de fluxo filho que não resolve vira
  `Diagnostic` `PL310`, não uma aresta com destino inventado — consistente
  com "falha de parsing vira Diagnostic" (regra de arquitetura 3).
- **Confiança de match como campo explícito (`"exact" | "heuristic")`**, não
  omitido — a UI (quando existir) pode mostrar aresta heurística com estilo
  diferente (tracejado, por exemplo, como já acontece com relacionamento
  inativo no MER), em vez de apresentar todo vínculo com o mesmo peso.

## Arquivos principais

- `packages/core/src/ir/schema.ts` (`DependencyEdgeSchema`, campo `dependencies`)
- `packages/core/src/ir/document.ts` (`createEmptyDocument`)
- `packages/core/src/parsers/solution/link-dependencies.ts` (novo)
- `packages/core/src/parsers/solution/parse.ts`
- `packages/core/src/parsers/flow/raw-shapes.ts` (`RawActionHost.workflow`, documentação)
- `packages/core/test/parsers/link-dependencies.test.ts`, `solution.test.ts`
- `docs/FORMAT-NOTES.md` (seção 4, itens 16/17)
