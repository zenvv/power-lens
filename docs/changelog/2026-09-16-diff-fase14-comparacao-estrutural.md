# Fase 14 do plano de novas features: diff estrutural entre duas versões

## O quê

`packages/core/src/diff/`: `diffDocuments(a, b)` compara dois
`PowerLensDocument` inteiros e devolve `{ artifacts: ArtifactDiff[] }` —
`ArtifactDiff = { key, kind, status: "added"|"removed"|"changed", entries }`,
`DiffEntry = { path, kind: "added"|"removed"|"changed", before?, after? }`.

- Artefatos casados por `"<kind>:<name>"`, não por `id` (gerado de novo a
  cada parse, não estável entre duas exportações do "mesmo" artefato).
  Presente só em `b` → `added`; só em `a` → `removed`; presente nos dois mas
  idêntico não aparece no resultado.
- Um differ dedicado por tipo de artefato (`diff-canvas-app.ts`,
  `diff-cloud-flow.ts`, `diff-data-model.ts`, `diff-report.ts`,
  `diff-solution-meta.ts`), todos construídos em cima de 4 helpers genéricos
  em `diff-utils.ts` (`diffPrimitive`, `diffPlain`, `diffRecord`,
  `diffKeyedArray`) — a mesma regra de "casar por chave, não por posição"
  se repete em cada nível: `Screen`/`Component`/`Control` por nome,
  `FlowNode` por `id`, `Relationship` por `from+to`, `Measure` por
  `table+name`.
- `path` usa notação `screens[Screen1].root.children[Label3].properties.Text.raw`
  — granular o bastante pra apontar o campo exato, genérica o bastante pra
  uma única tree-diff view (quando existir) renderizar qualquer `entries[]`
  sem UI dedicada por tipo de campo.

Fecha o plano de 13 features — igual às Fases 8/9/10/11/13/16, cobre só
`packages/core`. A UI (upload de um segundo arquivo + `DiffTreeView`) fica
pra quando o redesenho em andamento em `apps/web` estabilizar.

## Por quê

Fase 14, a maior peça do plano — builder quer saber "o que mudou de
verdade" entre duas exportações sem reabrir os dois arquivos lado a lado no
Studio.

## Decisões

- **`Control.properties` compara só `raw`** da `Expression`, não a árvore
  de `references` derivada dela — o que importa pro usuário é "a fórmula
  mudou", e `references` é sempre recalculável a partir de `raw` (mudar um
  sem o outro não é um caso real).
- **`Visual` (Fase 15) não tem chave estável** (`{ type, title?, fields }`,
  sem nome/id) — em vez de casar por posição (frágil: inserir um visual no
  meio da lista faria todo o resto parecer "mudado"), a lista inteira de
  `visuals` de uma página vira uma unidade só via `diffPlain` ("os visuais
  desta página mudaram", sem apontar qual). Limitação documentada no código,
  não uma omissão silenciosa.
- **`shallowStructuralEqual` (dentro de `diffPlain`) usa `JSON.stringify`**,
  não um deep-equal de propósito geral — aceitável porque os dois lados
  comparados sempre vêm do mesmo parser (mesma ordem de inserção de chave
  entre duas execuções), não de fontes arbitrárias.
- **Artefato idêntico não aparece no resultado** (nem como `"changed"` com
  `entries: []`) — a saída só lista o que de fato mudou, sem ruído.

## Arquivos principais

- `packages/core/src/diff/{diff-utils,diff-control,diff-canvas-app,diff-cloud-flow,diff-data-model,diff-report,diff-solution-meta,diff-documents,index}.ts`
- `packages/core/src/index.ts` (export)
- `packages/core/test/diff/diff-documents.test.ts`
