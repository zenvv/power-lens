# FORMAT-NOTES.md — conhecimento empírico sobre os formatos

> Gerado na fase de reconhecimento (Prompt 1). Fonte: leitura completa de `docs/SPEC.md` +
> leitura do código-fonte de `reference/CMPA/` (projeto anterior, Python, extrai dados de
> `.msapp`/SharePoint). **Nenhum código de produção foi escrito nesta tarefa.**
>
> Convenção usada abaixo: **[FATO]** = observado diretamente no código do CMPA ou em um
> arquivo real que ele processa. **[SUPOSIÇÃO]** = inferência minha, não verificada contra
> um arquivo real. **[LACUNA]** = não há como saber sem abrir um arquivo real.

---

## 0. Ressalva de escopo — leia isto antes do resto

**[FATO]** O CMPA é um pipeline de *Canvas Apps + listas SharePoint*, não uma ferramenta de
solution Dataverse. Não existe, em lugar nenhum do repositório, código que leia
`solution.xml`, `customizations.xml`, `Workflows/*.json` (no sentido de solution Dataverse)
ou `CanvasApps/*.msapp` aninhado dentro de uma solution. Uma busca pelo termo em todo o
repo não retorna nenhum resultado fora desta própria pesquisa.

O que o CMPA chama de "pacote de export" é um **export de app avulso do Power Apps
Studio** (zip contendo `Microsoft.Flow/` + `Microsoft.PowerApps/` + `manifest.json`), que é
uma estrutura completamente diferente da solution `.zip` do Dataverse descrita na seção 6
da spec. Isso significa que a **Seção 2 abaixo (solution .zip) é quase inteiramente
suposição** — o CMPA não me dá nenhum fato sobre esse formato. Isso é a lacuna mais
importante deste documento.

**[FATO]** O CMPA também nunca abre `Microsoft.Flow/flows/<guid>/definition.json` (a
definição real de um Cloud Flow), mesmo esse arquivo estando fisicamente presente ao lado
do `.msapp` no mesmo zip de export. Ele só sabe de um flow pelo *nome*, referenciado de
dentro do `.msapp`. Logo, **não tenho nenhum fato sobre a forma real de `actions`/
`runAfter`/triggers** de um Cloud Flow — só a convenção de path.

Essas duas lacunas cobrem justamente os dois formatos que a spec marca como "Completo"
na seção 6 (solution, definição de fluxo) sem eu ter evidência real ainda. Ver seção 4.

---

## 1. `.msapp` formato novo (`Src/*.pa.yaml`)

### 1.1 O zip que o usuário baixa não é o `.msapp`

**[FATO]** O que sai do Power Apps Studio ao exportar é um **zip externo**, não o
`.msapp` puro. Estrutura real observada (`reference/CMPA/scripts/lib/msapp.py`,
confirmado extraindo `bello/apps/compras/source/BELLOARAMADOS-COMPRAS_*.zip`):

```
Microsoft.Flow/flows/<flow-guid>/apisMap.json
Microsoft.Flow/flows/<flow-guid>/connectionsMap.json
Microsoft.Flow/flows/<flow-guid>/definition.json
Microsoft.Flow/flows/manifest.json
Microsoft.PowerApps/apps/<numeric-id>/<numeric-id>.json
Microsoft.PowerApps/apps/<numeric-id>/N<guid>-document.msapp   ← o .msapp de verdade
Microsoft.PowerApps/apps/<numeric-id>/N<guid>-identity.json
Microsoft.PowerApps/apps/<numeric-id>/N<guid>-logoSmallFile
manifest.json
```

O CMPA localiza o `.msapp` fazendo *suffix match* de `*.msapp` em `namelist()` e exige
exatamente 1 ocorrência, senão levanta erro (`load_inner_msapp_bytes`). Não confia no
nome da pasta numérica.

**Implicação para o detector do Power Lens [SUPOSIÇÃO]:** se o usuário soltar esse zip
externo em vez do `.msapp` puro, o detector de formato (seção 4 da spec) precisa
reconhecer essa estrutura como um invólucro e extrair o `.msapp` de dentro — ou avisar
explicitamente que só o `.msapp` interno é suportado. A spec não define esse caso.
Isso também significa que **um zip de export de app avulso contém, sozinho, tanto o app
quanto os flows que ele chama** (pasta `Microsoft.Flow/` irmã) — pode valer a pena o
detector reconhecer esse contêiner como um "pacote" que rende múltiplos artefatos, do
mesmo jeito que uma solution renderia.

### 1.2 Entradas dentro do `.msapp` interno

**[FATO]** 28 entradas observadas em um `.msapp` real:

```
AppCheckerResult.sarif
Assets/Images/<guid>.png (×5)
Components/4.json
ComponentsMetadata.json
Controls/1.json, Controls/15.json, Controls/266.json, Controls/77.json
Header.json
Properties.json
References/DataSources.json
References/ModernThemes.json
References/Resources.json
References/Templates.json
References/Themes.json
Resources/Controls/<hash>.FluentFilesImportControl.bundle.js
Resources/PublishInfo.json
Resources/<hash>.jpg
Src/App.pa.yaml
Src/Components/NAVBAR.pa.yaml
Src/FORNECEDORES_PAGE.pa.yaml
Src/PEDIDOS_FORMPAGE.pa.yaml
Src/PEDIDOS_PAGE.pa.yaml
Src/_EditorState.pa.yaml
```

**[FATO]** O CMPA só lê `Src/*.pa.yaml`, `References/DataSources.json` e `Properties.json`.
Tudo o resto (`Controls/*.json`, `Components/*.json`, `Header.json`,
`ComponentsMetadata.json`, `References/Templates|Themes|ModernThemes|Resources.json`,
`Resources/*`, `Assets/*`, `AppCheckerResult.sarif`) nunca é parseado — só é copiado
byte-a-byte ao re-empacotar. Ou seja, o CMPA não me dá nenhum fato sobre o *shape* desses
arquivos (eram o formato legado `Controls/*.json` antes do `Src/*.pa.yaml` existir — hoje
parecem coexistir como cache/metadata do Studio).

Conteúdo confirmado dos pequenos (não usados programaticamente, mas confirmam formato):
- `Header.json`: `{"DocVersion":"1.349","MinVersionToLoad":"1.349","MSAppStructureVersion":"2.4.0","LastSavedDateTimeUTC":"...","AnalysisOptions":{...}}`
- `ComponentsMetadata.json`: `{"Components":[{"Name":"NAVBAR","TemplateName":"<hash>","Description":"","AllowCustomization":true,"AllowAccessToGlobals":true}]}`

### 1.3 `Src/*.pa.yaml` — shape de topo

**[FATO]** Cada arquivo `.pa.yaml` começa com um banner de comentário fixo (8 linhas)
avisando que é formato "Preview" e linkando um JSON schema da Microsoft
(`https://go.microsoft.com/fwlink/?linkid=2304907`) — vale a pena buscar esse schema como
fonte de verdade complementar antes de codificar o parser.

- `Src/App.pa.yaml`: chave raiz `App:` → `Properties:` (OnStart, Theme, etc. no nível do
  app). Sem `Children`.
- Arquivos de tela: chave raiz `Screens:` → `{NomeDaTela: {Properties: {...}, Children: [...]}}`.
- **[FATO] Um arquivo por tela, nunca mais de uma tela por arquivo** — confirmado
  empiricamente pelo CMPA e validado contra o app real (`msapp.py::bucket_source_files`
  docstring + `TODO.md`).
- Arquivos de componente (ex. `Src/Components/NAVBAR.pa.yaml`): chave raiz
  `ComponentDefinitions:` → `{NomeDoComponente: {Properties: {...}, Children: [...]}}`.
  **[LACUNA]** o app real analisado só tinha 1 componente — não foi testado se um único
  arquivo pode conter *múltiplos* componentes. Ver seção 4.
- `Src/_EditorState.pa.yaml` existe mas nunca é lido pelo CMPA. **[SUPOSIÇÃO]** é estado
  de UI do editor (seleção, zoom) — irrelevante para o IR, mas não confirmado.

### 1.4 Árvore de controles

**[FATO]** Shape real observado:

```yaml
Children:
  - SCREEN_CONTAINER:
      Control: GroupContainer@1.5.0
      Variant: AutoLayout
      Properties:
        BorderStyle: =BorderStyle.None
        Width: =Parent.Width
      Children:
        - NAVBAR_1:
            Control: CanvasComponent
            ComponentName: NAVBAR
            Properties: {...}
        - MAIN_HEADER:
            Control: GroupContainer@1.5.0
            Children: [...]
```

- Cada item de `Children` é um dict de **uma única chave**: `{nome_do_controle: {...}}`.
  O CMPA assume isso (`_walk_children`) e defende contra `child` não ser dict.
- `Control:` codifica **tipo + versão** como `Tipo@major.minor.patch` (ex.
  `GroupContainer@1.5.0`, `ModernText@1.0.0`, `Image@2.2.3`, `Button@0.0.45`).
- **Instância de componente**: `Control:` vale literalmente `CanvasComponent`, e uma chave
  irmã `ComponentName:` aponta o componente real (ex. `NAVBAR`). **Isso é relevante para o
  IR**: o `Control.type` da spec (seção 5) precisa decidir se, para uma instância de
  componente, `type` vira `"CanvasComponent"` (perdendo a identidade) ou o nome do
  componente (ex. `"NAVBAR"`), com um campo à parte guardando que é uma instância. O CMPA
  nunca precisou resolver isso — ele só lê `Control` como texto solto.
- `Variant:` é chave irmã de `Control:`/`Properties:` (ex. `AutoLayout`) — variante de
  layout, presente em todo container observado.
- **[FATO] Ordem de documento validada**: propriedades do próprio controle são processadas
  antes de recursar nos filhos; filhos seguem a ordem da lista YAML. Isso foi validado
  batendo com os offsets literais de texto no YAML bruto — é a base pela qual o CMPA
  consegue reescrever a N-ésima ocorrência de um padrão com segurança.

### 1.5 Fórmulas dentro do YAML

**[FATO]** Toda propriedade com Power Fx é uma **string YAML começando com `=`**, ex.
`Fill: =glb.color.zinc100`. Fórmulas multilinha usam block scalar com "keep chomping":

```yaml
OnStart: |+
  =// comentário
  Set(glb, {...});
```

O `=` é o primeiro caractere *dentro* do block scalar, não um marcador YAML.

**[FATO] Armadilha crítica, com workaround já necessário no CMPA**: uma fórmula vazia
serializa como `Prop: =` — um `=` isolado na linha, sem block scalar. Em YAML 1.1, `=`
sozinho é a tag reservada `tag:yaml.org,2002:value`, para a qual `yaml.SafeLoader` **não
tem construtor por padrão** — o parse simplesmente quebra. O CMPA registra um construtor
customizado:

```python
def _construct_bare_equals(loader, node):
    return "="
_PowerFxLoader.add_constructor("tag:yaml.org,2002:value", _construct_bare_equals)
```

Confirmado contra dado real (`PaddingTop: =` existe de fato no `.pa.yaml` real). **Qualquer
parser YAML "de prateleira" no Power Lens vai quebrar no primeiro `.msapp` real que tiver
uma propriedade de fórmula vazia** — isso precisa de tratamento equivalente na lib `yaml`
usada em JS/TS (verificar se `eemeli/yaml` tem o mesmo problema com a tag `!!value`, ou se
resolve diferente).

**[FATO]** Acesso a campo com espaço usa aspas simples: `currentPedido.'Descrição da Compra'`,
`Value('ID Pedido')`. Campos Choice em `Patch()` usam registro `{Value: ...}`:
`'Forma de Pagamento': {Value: FRMPAG_TIPO.Selected.Value}`.

**[FATO]** Comentários usam `/* ... */` (bloco). O CMPA explicitamente **não** entende
comentário de linha `//` nas suas heurísticas de regex — limitação assumida, não corrigida.

### 1.6 `References/DataSources.json`

**[FATO]** Shape: `{"DataSources": [ {...}, ... ]}` — lista chapada, sem agrupar por tipo.
Cada entrada:

```jsonc
{
  "Name": "Documentos",
  "Type": "ConnectedDataSourceInfo",   // ou "ServiceInfo" (flow) / "StaticDataSourceInfo" (dado de exemplo)
  "DatasetName": "https://.../sites/Corp/compras",
  "TableName": "<guid-da-lista>",
  "ApiId": "/providers/microsoft.powerapps/apis/shared_sharepointonline",
  "DataEntityMetadataJson": { "<guid>": "<string JSON com o schema>" }
}
```

- `DataEntityMetadataJson[<guid>]` é **string JSON, não objeto aninhado** — precisa
  `JSON.parse` separado.
- `Type: "ServiceInfo"` com `ApiId` contendo `shared_logicflows` = **referência a um Cloud
  Flow chamável** (não é dado). `Type: "StaticDataSourceInfo"` = dado de exemplo de
  design-time, ignorável.
- Isso é a única forma que o CMPA tem de saber que um app "conhece" um flow — por nome,
  nunca por estrutura.

### 1.7 `Properties.json` e `LocalConnectionReferences`

**[FATO]** `Properties.json` tem `Name`, `Id`, `FileID`, e um campo
`LocalConnectionReferences` que é **uma string JSON serializada**, não objeto aninhado.
Decodificada:

```jsonc
{
  "<connGuid>": {
    "connectionInstanceId": "/providers/.../apis/shared_sharepointonline/connections/<id>",
    "dataSources": ["Fornecedores", "Ordens de Compra", ...],
    "datasets": {
      "https://.../sites/Corp/compras": {"dataSources": {"Fornecedores": {"tableName": "<guid>"}}},
      "https://.../sites/Corp/Financeiro": {"dataSources": {"Centros de Custo": {"tableName": "<guid>"}}}
    }
  }
}
```

**[FATO] Achado caro para o CMPA**: `References/DataSources.json` é só schema de
design-time. O Studio resolve o **binding real** (qual site/lista) via
`Properties.json → LocalConnectionReferences[connGuid].datasets[siteUrl].dataSources[nome].tableName`.
Reescrever só `DataSources.json` ao clonar um app **não bastou** — o Studio continuava
abrindo a lista original. Só funcionou reescrevendo também `LocalConnectionReferences`.

**Implicação para o IR [SUPOSIÇÃO]**: o `DataSource` do `CanvasApp` (spec seção 5) precisa,
no mínimo, de nome + site/URL + table id — e uma única conexão pode ter datasets em
**múltiplos sites diferentes** ao mesmo tempo (confirmado: uma única conexão SharePoint do
app real tem datasets tanto em `/sites/Corp/compras` quanto `/sites/Corp/Financeiro`). Ou
seja, "site" é uma propriedade por-lista, não por-app nem por-conexão.

### 1.8 Guards de campo opcional já necessários no CMPA

**[FATO]**, todos observados como `try/except`, `.get(...) or {}`, ou checagem de tipo
explícita no código:

- `References/DataSources.json` pode não existir (app sem fontes de dados conectadas).
- Um valor de `Properties:` pode não ser string (não é garantido que toda propriedade seja
  `"=..."`).
- Um item de `Children` pode não ser dict, ou seu valor pode ser `None`.
- Um `.pa.yaml` pode parsear para algo que não é dict no topo (arquivo vazio → `None`).
- `Screens`, `ComponentDefinitions`, `Children` são sempre tratados como potencialmente
  ausentes (`.get(...) or {}`).
- `LocalConnectionReferences` pode estar ausente/vazio.
- Tipo de coluna desconhecido no schema OData cai em `"Text"` por padrão, nunca quebra.

Isso valida diretamente o princípio "Degradação honesta" da spec (seção 3) — o CMPA já
precisou disso na prática, não é só teoria.

---

## 2. Estrutura interna de uma solution `.zip`

**Quase tudo abaixo é [SUPOSIÇÃO] baseada em conhecimento geral de Dataverse, não em
código do CMPA — ver ressalva na seção 0.** O CMPA nunca abre uma solution Dataverse.

- **[SUPOSIÇÃO]** Uma solution `.zip` exportada do Power Platform (unmanaged ou managed)
  tem tipicamente: `solution.xml` (metadata da solution: nome, versão, publisher, lista de
  componentes incluídos), `customizations.xml` (definições de entidades/tabelas custom,
  forms, views, processos), `[Content_Types].xml`, e pastas por tipo de componente —
  `Workflows/` (flows e processos, como `.json` para Power Automate modernos ou XAML para
  workflows clássicos), `CanvasApps/<nome>.msapp` (apps canvas embutidos), possivelmente
  `Other/` para outros metadados.
- **[SUPOSIÇÃO]** `customizations.xml` deve conter as definições de tabela (entidades
  Dataverse) — nome lógico, colunas, tipos, relacionamentos — mas eu não sei o schema XML
  exato, nem se relacionamentos many-to-many aparecem como uma entidade de junção
  implícita ou uma tag própria.
- **[SUPOSIÇÃO]** `Workflows/*.json` provavelmente tem o mesmo shape de
  `Microsoft.Flow/flows/<guid>/definition.json` do export avulso, já que ambos são Cloud
  Flows — mas isso é uma suposição de continuidade de formato, não uma confirmação (ver
  seção 4, esse arquivo não foi aberto nem pelo CMPA nem por mim).
- **[SUPOSIÇÃO]** Uma solution pode conter múltiplos apps, múltiplos flows e múltiplas
  tabelas simultaneamente — a spec (seção 5) já assume isso (`artifacts: Artifact[]`), mas
  eu não tenho evidência de como o `solution.xml` enumera/referencia esses componentes
  para que o parser saiba quantos e quais artefatos extrair.

**Não tenho nenhuma base empírica para os campos opcionais, armadilhas de encoding, ou
casos de borda desse formato.** Isso precisa vir de um arquivo real (ver seção 4).

---

## 3. Casos de borda e armadilhas reveladas pelo código do CMPA

Todos **[FATO]**, com onde foram encontrados:

1. **Tag YAML `=` colide com `tag:yaml.org,2002:value`** — ver seção 1.5. Quebra qualquer
   parser YAML sem construtor customizado no primeiro campo de fórmula vazio.
2. **Nome de exibição diverge do nome interno após rename no SharePoint** — coluna
   `Telefone` (nome interno) tinha título atual "E-mail"; coluna `Material` tinha título
   atual "Tel". Ler só o nome interno decodificado (`_x0020_` etc.) dá nome errado; o
   campo `title` no schema OData é que tem o nome atual.
3. **Reuso indevido do mesmo objeto ao re-casar campos entre extrações** — dois campos
   reais distintos (`Setor`↔`SetorPai`, `Segmento`↔`Setor`) colidiram no mesmo fallback de
   correspondência; corrigido rastreando `id()` de objetos já usados nesta rodada.
4. **Nome interno de 1 letra + dígito é auto-escapado pelo SharePoint** como referência de
   célula do Excel (`F1` → `_x0046_11`). Relevante para qualquer heurística de nomenclatura
   automática.
5. **Coluna `Title` obrigatória por padrão** em toda lista nova do SharePoint, mas
   desabilitada em listas de produção reais — assumir "obrigatória" por padrão quebra
   criação de registro.
6. **Falso positivo de classificação**: um campo com poucos valores numéricos pequenos
   (`12, 4, 27`) foi confundido com um código sequencial quando na verdade era uma chave
   estrangeira. Campos "classificados com sucesso" nunca passam por revisão humana — ponto
   cego sistêmico do pipeline classificar-depois-revisar.
7. **Contaminação de dados por copy-paste** em amostras reais: valores de um campo
   (`Banco`) idênticos aos de outro campo (`Observações`) no mesmo registro. Guard
   dedicado adicionado depois que isso quebrou uma execução ao vivo.
8. **Randomização ingênua de string quebra datas formatadas** — perturbar dígitos
   individualmente em um campo `DD/MM/AAAA` produz datas inválidas (`84/25/1354`).
   Precisa de aritmética de data real, não substituição de caractere.
9. **Regex de comentário só entende `/* */`, não `//`**, e o casamento de parênteses não
   entende parênteses dentro de string literal — limitações assumidas conscientemente,
   não corrigidas, por serem raras na prática.
10. **Valor de retorno de uma chamada usado inline** (`Flow.Run(...).path`) muda o que uma
    substituição válida significa — detectado checando se o caractere logo após o `)` de
    fechamento é um `.`.
11. **Separador de path dentro do zip pode ser `\` ou `/`** — toda comparação de nome de
    entrada no CMPA normaliza antes de comparar. **Relevante direto para o parser em
    JS/TS**: não assumir `/` sempre ao procurar entradas dentro do zip.
12. **Coluna Lookup com "projeção" de colunas derivadas** nomeia as colunas projetadas como
    `<nome interno primário>_x003a__x0020_<campo projetado>` (codifica `": "` literalmente).
    Heurística só é confiável quando existe exatamente 1 candidato "primário" sem sufixo e
    todos os outros do grupo batem com esse prefixo — senão, cai para tratar tudo como
    texto plano, para nunca inferir um relacionamento errado.

---

## 4. Lacunas — perguntas concretas que precisam de um arquivo real

**Solution Dataverse (bloqueia toda a seção "Completo" da spec para esse formato):**

1. Qual o schema real de `solution.xml`? Como ele enumera os componentes incluídos
   (apps, flows, tabelas) para que o parser saiba o que extrair sem escanear o zip inteiro?
2. Qual o schema de `customizations.xml` para tabelas Dataverse — nome lógico vs nome de
   exibição, tipos de coluna, e como relacionamentos (1:N, N:N) aparecem?
3. `Workflows/*.json` dentro de uma solution tem o mesmo shape de
   `Microsoft.Flow/flows/<guid>/definition.json` de um export avulso, ou é diferente
   (ex. envolve infra de Dataverse como plugin steps)?
4. Um `CanvasApps/<nome>.msapp` dentro de uma solution é **byte-idêntico** ao `.msapp` de
   um export avulso de app (mesma estrutura interna documentada na seção 1), ou a solution
   embrulha/transforma algo?
5. Como uma solution referencia um Dataverse table (não SharePoint) como fonte de dados de
   um Canvas App — o `References/DataSources.json` do `.msapp` embutido usa o mesmo
   `ApiId`/`Type` pattern do SharePoint, ou um totalmente diferente (`shared_commondataservice`?)?

**Cloud Flow / `definition.json` — atualização pós-Fase 2:**

O parser de fluxo (`packages/core/src/parsers/flow/`) foi implementado com base no schema
**publicamente documentado** do Azure Logic Apps Workflow Definition Language (que o Power
Automate reaproveita) — isso é uma fonte bem mais sólida do que uma suposição às cegas
(é o mesmo schema usado por `$schema` em todo `definition.json` real que já vi citado),
mas **ainda não foi confirmado contra um `Microsoft.Flow/flows/<guid>/definition.json`
real deste projeto**. Perguntas 6 e 7 abaixo estão, na prática, respondidas pelo schema
público — meu nível de confiança nelas subiu bastante — mas continuam como "verificar
contra arquivo real" até eu abrir um de verdade:

6. **[SUPOSIÇÃO fundamentada em documentação pública, não em arquivo do projeto]** `actions`
   e `triggers` são objetos indexados por nome (não listas), e cada action tem
   `runAfter: Record<nomeDaActionAnterior, string[]>` — é isso que o parser assume.
7. **[SUPOSIÇÃO fundamentada em documentação pública]** `If` aninha as ações do branch
   verdadeiro em `actions`, do branch falso em `else.actions`; `Switch` usa
   `cases.<nome>.actions` e `default.actions`; `Scope`/`Foreach` usam `actions` direto. O
   parser assume que `runAfter` só referencia irmãos dentro do mesmo nível de aninhamento
   (nunca uma action de outro escopo) — isso é uma regra real do Logic Apps, não invenção
   minha, mas vale confirmar que o Power Automate não tem nenhuma variação aqui.
8. `apisMap.json` e `connectionsMap.json` (irmãos de `definition.json`) continuam não
   abertos — o parser de conector (`extractConnectorName`) só olha `inputs.host.apiId`/
   `connectionName` dentro do próprio `definition.json`, sem cruzar com esses arquivos.
   Pode ser que eles tenham metadata melhor para `CloudFlow.connections` do que o que dá
   pra extrair só do `definition.json`.
9. Um `Workflows/*.json` dentro de uma **solution** de verdade tem o mesmo shape de um
   `Microsoft.Flow/flows/<guid>/definition.json` de export avulso? O parser de solution
   agora tenta rodar o parser de fluxo em cada `Workflows/*.json` encontrado (em vez de só
   avisar que existe), e degrada para diagnóstico por arquivo se o shape não bater — mas
   isso continua sendo uma suposição de continuidade de formato entre dois contextos
   diferentes (solution vs. export avulso de app), não uma confirmação.

**`.msapp` — pontas soltas mesmo com o app real disponível:**

10. Um único arquivo `Src/Components/*.pa.yaml` pode conter **múltiplos** componentes sob
    `ComponentDefinitions:`, ou é sempre 1:1 como as telas? (o app analisado só tinha 1
    componente — regra "1 por arquivo" foi validada para telas, não para componentes.)
11. Como aparece um **parâmetro/propriedade customizada de componente** (component
    property/input/output) na definição do componente? Isso não apareceu no componente
    `NAVBAR` observado (ou não foi usado por ele) e é importante para o `Component` do IR.
12. `Controls/*.json` e `Components/*.json` (formato antigo, hoje aparentemente cache) —
    ainda têm alguma informação que não está em `Src/*.pa.yaml`, ou são 100% redundantes e
    seguros de ignorar no parser novo?
13. ~~A tag YAML `=`...~~ **[RESOLVIDO, ver seção 5.1]** — a lib `yaml` não tem esse problema.
14. `Src/_EditorState.pa.yaml` é seguro ignorar sempre, ou existe algum caso (ex. ordem de
    telas no navegador do Studio) em que ele carrega informação que não está em nenhum
    outro lugar?

**Power BI (`.pbit`/`.pbip`/`.pbix`) — zero cobertura no CMPA:**

15. Nenhum fato disponível aqui; o corpus do CMPA não toca Power BI. `DataModelSchema`
    (TMSL) e `DataMashup` precisam ser explorados do zero contra um `.pbit` real antes da
    Fase 3.

---

## 5.1 Atualização pós-Prompt 4 — respostas e novos achados

**Pergunta 12 respondida [FATO]**: a lib `yaml` (eemeli) usada em JS/TS **não** tem o
problema do PyYAML com `Prop: =`. Ela segue YAML 1.2 e trata `=` sozinho como string
literal comum (`"="`), sem exigir nenhum construtor customizado. Confirmado rodando
`YAML.parse("PaddingTop: =\n")` diretamente. Ou seja, o workaround do CMPA (seção 1.5) é
uma particularidade do PyYAML/YAML 1.1 e **não precisa ser portado**.

**[FATO] Novo achado, descoberto construindo a fixture sintética**: uma fórmula que
contém um literal de registro com dois-pontos (ex. `{Titulo: Title1.Text}`) **não pode**
ser escrita como escalar de uma linha em YAML — `Titulo:` seguido de espaço é ambíguo com
sintaxe de mapeamento, e o parser rejeita com `Nested mappings are not allowed in compact
mappings`. Formulas assim só são válidas em `.pa.yaml` como block scalar (`|+`/`|-`), do
mesmo jeito que `OnStart` já era. **Implicação**: qualquer fórmula "grande o suficiente"
para ter um registro inline provavelmente já vem como block scalar no arquivo real; um
parser que só soubesse ler escalar de uma linha quebraria em qualquer app de verdade que
use `Patch(ds, Defaults(ds), {Campo: valor})` numa única linha — o que é extremamente
comum. Vale testar isso especificamente contra um `.msapp` real assim que houver um
disponível (ver seção 4).

**[LACUNA nova]** Onde fica a ordem real das telas? Não está em nenhum lugar que o CMPA
lê. O parser do Power Lens hoje infere a ordem pela ordem alfabética dos arquivos
`Src/*.pa.yaml` e emite um diagnóstico `info` avisando disso. Precisa de um `.msapp` real
com mais de uma tela para confirmar se a ordem real vem de algum outro arquivo do pacote
(candidatos não verificados: `Header.json`, `Controls/*.json`).

**[RESOLVIDO]** `Src/App.pa.yaml` — `OnStart` do app agora tem representação:
`CanvasApp.onStart?: Expression`, populado pelo parser (mesmo tratamento de
literal/formula/references que qualquer outra propriedade), com teste cobrindo inclusive a
extração de variável (`Set(glb, ...)`) e de referências dentro dele. `theme` continua sem
receber o formato bruto do app (`=PowerAppsTheme`) — não havia evidência de qual era o
formato pretendido do campo já existente na spec (fórmula bruta vs. paleta resolvida), e
mudar o significado de um campo já definido sem necessidade concreta não parecia a decisão
certa. Documentado em `docs/IR.md`.

## 5. O que isso muda no design do IR (observação, não implementação)

Registrando aqui para a fase de implementação do IR (Prompt 3), sem escrever código agora:

- `Control.type` (spec seção 5) precisa de uma decisão explícita para instâncias de
  componente: hoje a spec não distingue `type: "Button"` de uma instância de componente
  cujo `Control:` bruto é sempre a string genérica `CanvasComponent`. Sugestão a validar:
  manter `type` como o nome real do componente (`"NAVBAR"`) e adicionar um jeito de marcar
  "isto é uma instância de componente" — para não perder a informação que o CMPA perde.
- `DataSource` do IR precisa suportar site/URL como atributo **por data source**, não por
  app nem por conexão — uma única conexão pode servir listas de múltiplos sites.
- O parser YAML precisa de tratamento explícito para propriedade de fórmula vazia
  (`Prop: =`) desde o primeiro teste — é praticamente garantido aparecer em qualquer
  `.msapp` real de tamanho não-trivial.
- Normalizar separador de path (`\` vs `/`) ao procurar entradas dentro de qualquer zip
  (`.msapp`, solution, export avulso) — o CMPA precisou disso, não é hipotético.
