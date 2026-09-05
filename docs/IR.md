# IR.md — o schema do Power Lens, documentado

> Fonte de verdade real: `packages/core/src/ir/schema.ts` (zod). Este documento é a versão
> legível por humanos, mantida em sincronia manualmente — se os dois divergirem, o código
> vence. Ver também `docs/SPEC.md` seção 5 (rascunho original) e `docs/FORMAT-NOTES.md`
> (evidência empírica sobre os formatos de origem).

---

## Versionamento

`schemaVersion` é hoje o literal `"0.1"`. Política: só sobe quando um campo existente muda
de forma ou significado de um jeito que quebra quem já lê um documento antigo (remover
campo, mudar tipo, renomear chave). Adicionar campo novo opcional, ou uma nova variante de
`Artifact`/`Diagnostic`, **não** exige bump — o schema é aditivo por padrão.

## Divergências em relação ao rascunho original da spec

A seção 5 do `SPEC.md` é um rascunho inicial. Cinco tipos são **referenciados** por ela
(`CanvasApp.components`, `CanvasApp.dataSources`, `CanvasApp.variables`,
`CloudFlow.connections`, e o próprio `SolutionMeta` no union de `Artifact`) mas nunca
**definidos** no bloco de código. Eles foram adicionados aqui, deliberadamente minimalistas
e comentados no código como tal:

| Tipo | Por quê existe | Onde revisar |
|---|---|---|
| `Component` | `CanvasApp.components: Component[]` | `docs/FORMAT-NOTES.md` §1.3 |
| `DataSource` | `CanvasApp.dataSources: DataSource[]` | `docs/FORMAT-NOTES.md` §1.6/1.7 |
| `VariableUsage` | `CanvasApp.variables: VariableUsage[]` | spec §5 prosa: "inferido de Set/UpdateContext/Collect" |
| `ConnectionRef` | `CloudFlow.connections: ConnectionRef[]` | `docs/FORMAT-NOTES.md` §4 (sem evidência real ainda) |
| `SolutionMeta` | membro do union `Artifact` | `docs/FORMAT-NOTES.md` §2 (schema de `solution.xml` não verificado) |

Um sexto campo, `CanvasApp.onStart`, foi adicionado **depois** do parser já estar rodando
contra arquivos reais: `Src/App.pa.yaml` (o `OnStart` do app) não tinha onde morar, e isso
importa porque a futura regra de health check `PL005` ("`OnStart` acima de N linhas",
spec §7) precisa inspecionar exatamente esse valor. `theme` (já presente na spec como
`Record<string,string>`) foi deixado como está — não há evidência de que seu formato
pretendido seja a fórmula bruta (`=PowerAppsTheme`) versus uma paleta já resolvida, então
não decidi isso sem necessidade.

## Estrutura geral

```
PowerLensDocument
├─ schemaVersion: "0.1"
├─ source: Source
├─ artifacts: Artifact[]      (união discriminada por `kind`)
└─ diagnostics: Diagnostic[]
```

### `Source`

| Campo | Tipo | Observação |
|---|---|---|
| `fileName` | `string` | nome do arquivo como o usuário soltou |
| `fileSize` | `number` | bytes |
| `detectedFormat` | `SourceFormat` | `"msapp" \| "solution" \| "flow" \| "pbit" \| "pbip" \| "pbix"` |
| `parsedAt` | `string` (ISO datetime) | validado com `z.iso.datetime()` |
| `parserVersion` | `string` | hoje sempre `CORE_VERSION` (`packages/core/src/version.ts`) |

### `Diagnostic`

| Campo | Tipo | Observação |
|---|---|---|
| `code` | `string` | ver convenção de faixas abaixo |
| `severity` | `"error" \| "warning" \| "info"` | |
| `message` | `string` | |
| `artifactId?` | `string` | não populado por nenhum parser ainda |
| `path?` | `string` | caminho dentro do arquivo/artefato, quando aplicável |
| `hint?` | `string` | |

**Convenção de faixas de código** (não é regra formal do zod, só como os parsers já
existentes se organizaram, para não colidir com as futuras regras `PL001`–`PL010` da spec):

- `PL0xx` (`PL001`–`PL010`): reservado para as regras de health check (spec §7), ainda não
  implementadas.
- `PL1xx`: parser de `.msapp` (`parsers/msapp/`).
- `PL2xx`: detector de formato (`detect/`).
- `PL3xx`: parser de solution (`parsers/solution/`).

## `Artifact` — união discriminada por `kind`

### `CanvasApp` (`kind: "canvasApp"`)

Produzido por `parsers/msapp/`. É o único artefato com cobertura completa hoje.

| Campo | Tipo | Preenchido pelo parser? |
|---|---|---|
| `id`, `name` | `string` | sim — de `Properties.json` (`Id`/`Name`), com fallback pro nome do arquivo |
| `appVersion?` | `string` | não — nenhuma fonte confirmada ainda |
| `screens` | `Screen[]` | sim |
| `components` | `Component[]` | sim |
| `dataSources` | `DataSource[]` | sim — filtra fora referências a flow e dado de amostra estático |
| `variables` | `VariableUsage[]` | sim — via regex sobre `Set`/`Collect`/`ClearCollect`/`UpdateContext` |
| `theme?` | `Record<string,string>` | não |
| `onStart?` | `Expression` | sim — de `Src/App.pa.yaml` |

`Screen` e `Component` têm o mesmo formato de fundo (`{ name, root: Control }`, `Screen`
soma `order`), porque o arquivo bruto também é simétrico (`Screens.<nome>` e
`ComponentDefinitions.<nome>` têm ambos `Properties` + `Children`). `root` é sintetizado
pelo parser — o arquivo bruto não tem um único nó raiz, tem uma lista de `Children` direto
na tela/componente; o parser materializa isso como um `Control` cujo `name`/`type` é o
próprio nome da tela/componente.

`Control` é recursivo (`children: Control[]`) — por isso o tipo é escrito uma vez em
`schema.ts` fora de `z.infer` puro (zod não infere através de `z.lazy()` sozinho) e
reexportado a partir de lá como fonte única.

`Expression.kind` é `"literal"` quando o parser reconhece a fórmula como uma constante
(string entre aspas, número, `true`/`false`); qualquer outra coisa vira `"formula"` e ganha
`references` — extraídas por análise rasa (regex), nunca por um parser de gramática Power
Fx (spec, Prompt 4). Um identificador ambíguo fica sem classificação em vez de ser
classificado errado.

### `SolutionMeta` (`kind: "solutionMeta"`)

Produzido por `parsers/solution/` a partir de `solution.xml`. Schema do arquivo de origem
**não verificado contra um arquivo real** (`docs/FORMAT-NOTES.md` §2) — trate `version` e
`publisher` como best-effort.

### `CloudFlow`, `DataModel`, `Report` (`kind: "cloudFlow" | "dataModel" | "report"`)

Definidos no schema, com renderer Markdown pronto para eles, mas **nenhum parser produz
esses artefatos ainda** — são Fase 2 (`CloudFlow`) e Fase 3 (`DataModel`, `Report`) do
roadmap. Existirem no schema desde já é intencional: um renderer deve trabalhar a partir do
formato da união, não da cobertura atual dos parsers.

## Validação

`validateDocument(input: unknown)` roda `PowerLensDocumentSchema.safeParse` e devolve:

```ts
{ ok: true; document: PowerLensDocument }
  | { ok: false; message: string; issues: { path: string; message: string }[] }
```

`message` já vem concatenada e legível (`"source.fileSize: Required; ..."`); `issues` é a
mesma informação estruturada, campo a campo, caso o consumidor precise apontar erros
específicos na UI.

`createEmptyDocument({ fileName, fileSize, detectedFormat })` preenche `parsedAt` (agora,
ISO) e `parserVersion` (`CORE_VERSION`) automaticamente — os parsers usam isso como ponto
de partida e vão anexando `artifacts`/`diagnostics` conforme processam o arquivo.
