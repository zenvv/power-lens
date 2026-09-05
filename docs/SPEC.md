# Power Lens — Spec v0.1

> Ferramenta open source, 100% client-side, para ler, entender e documentar artefatos da Power Platform.

---

## 1. Objetivo

Dado qualquer arquivo exportado da Power Platform, produzir em um só lugar:

1. Um **resumo estrutural** legível do artefato.
2. Uma **visualização** adequada ao tipo (MER para modelos, DAG para fluxos, árvore/wireframe para apps).
3. Uma **documentação exportável** (Markdown/HTML) gerada de forma determinística.
4. Um **health check** estrutural (avisos, não correções).
5. Um **pacote de contexto** pronto para ser lido por um LLM.

O usuário-alvo é quem precisa entender um app/fluxo/modelo que não escreveu, sem abrir o Studio, sem ambiente, sem licença e sem subir nada para lugar nenhum.

## 2. Não-objetivos

Explícito, para não virar escopo por osmose:

- Não é um builder nem um editor. Power Lens **nunca escreve** de volta em um `.msapp`, solution ou `.pbix`.
- Não é um emulador de app. Não avalia Power Fx com dados.
- Não é um substituto do App Checker / Solution Checker da Microsoft.
- Não tem backend. Não tem conta de usuário. Não tem telemetria.
- Não é produto pago.

## 3. Princípios

| Princípio | Consequência prática |
|---|---|
| **Client-side only** | Todo parsing acontece no browser. Nenhum arquivo sai da máquina. Deploy é estático. |
| **IR-first** | Nenhum renderer lê arquivo bruto. Tudo consome o IR. |
| **Determinístico por padrão** | Toda a extração e a documentação base funcionam sem IA. IA é camada opcional em cima. |
| **Degradação honesta** | Quando não dá para extrair algo, a UI diz o que falta e por quê, em vez de mostrar vazio. |
| **Offline-capable** | Depois de carregada, a app funciona sem rede (exceto a chamada opcional de LLM). |

## 4. Arquitetura

```
arquivo bruto
     │
     ▼
┌──────────────┐   detecta formato por magic bytes + estrutura interna do zip
│   detector   │
└──────┬───────┘
       ▼
┌──────────────┐   um parser por formato; única camada que conhece o arquivo real
│   parsers    │   msapp · solution · flow · pbit/pbip · pbix (parcial)
└──────┬───────┘
       ▼
┌══════════════┐
║      IR      ║   JSON canônico, validado por schema. O produto de verdade.
└══════┬═══════┘
       ▼
┌──────────────────────────────────────────────────────────┐
│ renderers                                                │
│  summary · MER · flow DAG · doc export · health check ·  │
│  wireframe · AI context pack                             │
└──────────────────────────────────────────────────────────┘
```

Regra dura: **um renderer que precise abrir um zip é um bug de arquitetura.** Se um renderer precisa de um dado que não está no IR, o IR é que cresce.

## 5. O IR

Rascunho inicial. É o artefato mais importante do projeto e deve ser versionado com `schemaVersion` desde o primeiro commit.

```ts
type PowerLensDocument = {
  schemaVersion: "0.1";
  source: {
    fileName: string;
    fileSize: number;
    detectedFormat: SourceFormat;   // "msapp" | "solution" | "flow" | "pbit" | "pbip" | "pbix"
    parsedAt: string;               // ISO
    parserVersion: string;
  };
  artifacts: Artifact[];            // uma solution rende N artefatos
  diagnostics: Diagnostic[];        // problemas de parsing + health check
};

type Artifact =
  | CanvasApp
  | CloudFlow
  | DataModel
  | Report
  | SolutionMeta;

// ── Canvas App ────────────────────────────────────────────
type CanvasApp = {
  kind: "canvasApp";
  id: string;
  name: string;
  appVersion?: string;
  screens: Screen[];
  components: Component[];
  dataSources: DataSource[];
  variables: VariableUsage[];       // inferido de Set/UpdateContext/Collect
  theme?: Record<string, string>;
};

type Screen = {
  name: string;
  order: number;
  root: Control;                    // árvore, não lista chapada
};

type Control = {
  name: string;
  type: string;                     // "Label", "Button", "Gallery", "MyComponent"...
  properties: Record<string, Expression>;
  children: Control[];
};

type Expression = {
  raw: string;
  kind: "literal" | "formula";
  literal?: string | number | boolean;   // preenchido só quando kind === "literal"
  references: Reference[];               // extraído por análise rasa, não por parser completo
};

type Reference = {
  kind: "control" | "dataSource" | "variable" | "collection" | "function" | "screen";
  name: string;
};

// ── Cloud Flow ────────────────────────────────────────────
type CloudFlow = {
  kind: "cloudFlow";
  id: string;
  name: string;
  trigger: FlowNode;
  actions: FlowNode[];              // lista chapada; hierarquia via parentId
  connections: ConnectionRef[];
};

type FlowNode = {
  id: string;
  name: string;
  type: string;                     // "OpenApiConnection", "Foreach", "If", "Scope"...
  connectorName?: string;
  parentId?: string;                // escopo/branch pai
  runAfter: { id: string; statuses: string[] }[];
  summary?: string;                 // descrição curta e humana dos inputs
};

// ── Modelo de dados ───────────────────────────────────────
type DataModel = {
  kind: "dataModel";
  id: string;
  name: string;
  tables: ModelTable[];
  relationships: Relationship[];
  measures: Measure[];
};

type ModelTable = {
  name: string;
  columns: { name: string; dataType: string; isCalculated: boolean; expression?: string }[];
  sourceExpression?: string;        // M / Power Query
  isHidden?: boolean;
};

type Relationship = {
  from: { table: string; column: string };
  to:   { table: string; column: string };
  cardinality: "oneToMany" | "manyToOne" | "oneToOne" | "manyToMany";
  crossFilter: "single" | "both";
  isActive: boolean;
};

type Measure = { name: string; table: string; expression: string; formatString?: string };

// ── Relatório (páginas/visuais) ───────────────────────────
type Report = {
  kind: "report";
  id: string;
  name: string;
  pages: { name: string; order: number; visuals: Visual[] }[];
};

type Visual = { type: string; title?: string; fields: string[] };

// ── Diagnóstico ───────────────────────────────────────────
type Diagnostic = {
  code: string;                     // "PL001"
  severity: "error" | "warning" | "info";
  message: string;
  artifactId?: string;
  path?: string;                    // "Screen1/Gallery1/Label3.Text"
  hint?: string;
};
```

## 6. Cobertura por formato

| Formato | Suporte | Observações |
|---|---|---|
| `.msapp` novo (`Src/*.pa.yaml`) | **Completo** | Alvo primário. Zip + YAML. |
| `.msapp` legado (`Controls/*.json`) | Fase posterior | Parser separado que emite o mesmo IR. |
| Solution `.zip` | **Completo** | `solution.xml`, `customizations.xml`, `Workflows/*.json`, `CanvasApps/*.msapp`, metadata Dataverse. Rende múltiplos artefatos. |
| Definição de fluxo (JSON) | **Completo** | `actions` + `runAfter` já é um DAG. |
| `.pbit` | **Completo** | `DataModelSchema` (TMSL) é JSON legível. |
| `.pbip` | **Completo** | Preferir `model.bim` (TMSL) quando existir; TMDL exige tokenizer próprio, fase posterior. |
| `.pbix` | **Parcial** | `Layout` (páginas/visuais) e `DataMashup` (M) são legíveis. O `DataModel` está em Xpress9 comprimido/criptografado e **não** é acessível sem reimplementar VertiPaq. A UI deve dizer isso e sugerir salvar como `.pbit`/`.pbip`. |

## 7. Renderers

**Summary.** Cabeçalho do artefato: contagens, fontes de dados, conectores, dependências externas, data de parse.

**MER / modelo.** Tabelas como nós, relacionamentos como arestas com notação de cardinalidade, colunas expansíveis, medidas em painel lateral. Layout automático + arrasto manual persistido em localStorage.

**Flow DAG.** Nós na ordem topológica derivada de `runAfter`. Branches de condicional lado a lado, escopos como grupos colapsáveis, cor por conector.

**Doc export.** Markdown e HTML autocontido a partir do IR, com seções fixas. Zero IA envolvida. Este é o baseline com o qual a saída da IA é comparada.

**Health check.** Regras puramente estruturais, sem parser de Power Fx:

- `PL001` tela órfã (nenhuma navegação aponta para ela)
- `PL002` controle com nome default (`Label1`, `Button2`, ...)
- `PL003` datasource declarado e nunca referenciado
- `PL004` GUID hardcoded em fórmula
- `PL005` `OnStart` acima de N linhas
- `PL006` fórmula idêntica repetida em ≥3 controles
- `PL007` propriedade de acessibilidade vazia em controle interativo
- `PL008` função com risco conhecido de delegation sobre datasource remoto
- `PL009` conector premium em uso
- `PL010` relacionamento inativo no modelo

Cada regra é um módulo puro `(doc: PowerLensDocument) => Diagnostic[]`. Fáceis de testar, fáceis de desligar.

**Wireframe.** Renderização estática por tela. Resolve `X`/`Y`/`Width`/`Height`/`Text`/`Fill` quando são literais ou aritmética constante; tudo o mais vira placeholder marcado como dinâmico. Chamar de wireframe/blueprint na UI, nunca de "preview". Última fase.

**AI context pack.** Ver seção 9.

## 8. Stack

- **Monorepo** pnpm workspaces: `packages/core` (parsers + IR + regras, zero DOM, roda em Node e no browser), `apps/web` (viewer), `packages/cli` (opcional, fase posterior).
- **Web**: Vite + React + TypeScript. Não precisa de Next aqui: não há SSR, não há rotas de servidor, o deploy é um bundle estático. Se preferir Next por familiaridade, usar `output: "export"` e não introduzir nada de servidor.
- **Zip**: `fflate` (menor e mais rápido que jszip, e suporta stream).
- **YAML**: `yaml` (eemeli).
- **Validação do IR**: `zod`, com o schema como fonte de verdade e os tipos TS derivados dele.
- **Grafos**: `@xyflow/react` + `elkjs` ou `dagre` para layout. Mermaid como formato de *export*, não de render.
- **Testes**: Vitest, com snapshot do IR por fixture.

## 9. Camada de IA

Duas saídas, ambas de primeira classe:

**BYOK.** Chave do próprio usuário, guardada em localStorage, chamada direta do browser para o provedor. Custo zero para o projeto e coerente com o princípio de client-side. Suportar Gemini (tier gratuito é o menor atrito para quem só quer testar), Anthropic e OpenAI. Deixar explícito na UI onde a chave fica e que ela nunca trafega para outro lugar.

**Context pack.** Download de um `.zip` com:

```
power-lens-pack/
  ir.json              ← o IR completo
  summary.md           ← doc determinística já gerada
  PROMPT.md            ← instruções prontas para colar em qualquer LLM
  README.txt           ← o que fazer com isso
```

Isso não é plano B. Boa parte do público trabalha em ambiente corporativo que bloqueia chave de API pessoal mas tem Copilot ou ChatGPT liberado numa aba. Colar e rodar.

**Regra de token**: mandar sempre o IR, nunca os arquivos originais. O IR condensado cabe folgado em contexto e gera relatório melhor porque o ruído já foi filtrado. Para artefatos muito grandes, prever um IR "podado" (`toPromptPayload(doc, { maxDepth, includeExpressions })`).

## 10. Roadmap

Cada fase é entregável e demonstrável sozinha.

**Fase 1 — Fundação.** Detector de formato, parser `.msapp` novo, parser solution `.zip`, IR + schema zod, doc export em Markdown, context pack. Fim da fase: dá para jogar um `.msapp` e sair com documentação.

**Fase 2 — Fluxos.** Parser de definição de fluxo, DAG renderer. Melhor relação esforço/impacto visual do projeto.

**Fase 3 — Modelo de dados.** Parser `.pbit`/`.pbip`, parser de tabelas Dataverse a partir da solution, MER viewer. Parser `.pbix` parcial com aviso.

**Fase 4 — Health check.** Regras `PL001`–`PL010`, painel de diagnósticos, filtro por severidade.

**Fase 5 — Wireframe.** Render estático por tela. Beta permanente é resultado aceitável.

**Fase 6 — BYOK.** Chamada direta ao provedor com a chave do usuário.

## 11. Corpus de teste

O ativo mais valioso do projeto e o mais fácil de vazar sem querer.

- `fixtures/real/` — arquivos reais, **gitignored**, nunca commitados.
- `fixtures/synthetic/` — apps/fluxos/modelos pequenos e criados do zero, commitados, cobrindo os casos de borda.
- `fixtures/__snapshots__/` — IR esperado por fixture.

Antes de qualquer fixture real entrar no repo, ele passa por anonimização (nomes de tabela, GUIDs, URLs de ambiente, e-mails). Na dúvida, não commita.

## 12. Estrutura de pastas

```
power-lens/
├─ packages/
│  ├─ core/
│  │  ├─ src/
│  │  │  ├─ ir/            schema zod + tipos + versionamento
│  │  │  ├─ detect/        identificação de formato
│  │  │  ├─ parsers/       msapp/ solution/ flow/ powerbi/
│  │  │  ├─ rules/         PL001..PL0NN, um arquivo por regra
│  │  │  ├─ render/        markdown, html, prompt pack
│  │  │  └─ index.ts
│  │  └─ test/
│  └─ cli/                 (fase posterior)
├─ apps/web/
│  └─ src/
│     ├─ components/
│     ├─ views/            summary, model, flow, diagnostics, wireframe
│     └─ lib/
├─ docs/
│  ├─ SPEC.md              este arquivo
│  ├─ FORMAT-NOTES.md      conhecimento empírico sobre os formatos
│  └─ IR.md                schema documentado
├─ fixtures/
└─ CLAUDE.md
```
