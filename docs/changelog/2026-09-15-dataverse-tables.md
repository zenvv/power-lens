# Ponta solta da Fase 3: tabelas Dataverse a partir da solution

## O quê

- `packages/core/src/parsers/solution/customizations-xml.ts`: parser de `customizations.xml`
  (tabelas Dataverse dentro de uma solution) — produz um artefato `DataModel`, reaproveitando
  exatamente o mesmo shape usado pro modelo do Power BI (tabelas/colunas/relacionamentos).
  Automaticamente ganha o viewer MER e o painel de medidas que já existiam, sem nenhum código
  de UI novo.
- `packages/core/src/parsers/solution/parse.ts`: troca o antigo diagnóstico placeholder
  ("tabelas Dataverse ainda não são parseadas nesta fase") pela chamada real ao parser.
- `docs/FORMAT-NOTES.md` seção 2.1: schema de `customizations.xml` documentado a partir do
  XSD oficial (`CustomizationsSolution.xsd`).
- Fixture `fixtures/synthetic/solution-minimal/customizations.xml` (3 tabelas, 1
  relacionamento 1:N, 1 N:N, 1 coluna calculada) + 5 testes novos em `solution.test.ts`.

## Por quê

Ponta solta deixada na Fase 3 (o parser de `.pbit` cobriu o modelo de dados do Power BI, mas
uma solution Dataverse também carrega tabelas, e ficou pendente).

## Decisões

- **Fonte da verdade**: o `FORMAT-NOTES.md` marcava zero conhecimento empírico sobre
  `customizations.xml` — nem o schema XML. Perguntado ao usuário como confirmar antes de
  codar; pesquisa na doc prosa da Microsoft não trouxe exemplos de tag suficientes (só a
  referência Web API de `entity`/`entityrelationship`, que é o schema do *serviço*, não do
  *arquivo exportado*). Segunda pergunta: usuário pediu pra baixar e ler o `.xsd` oficial
  (`Schemas.zip`, linkado pela própria doc da Microsoft) diretamente — abordagem que funcionou:
  o XSD tem a estrutura completa de `Entities > Entity > EntityInfo > entity > attributes >
  attribute` e `EntityRelationships > EntityRelationship`, incluindo o enum completo de
  `CrmDataType` e a confirmação de que só existem dois `EntityRelationshipType`
  ("OneToMany"/"ManyToMany" — sem "ManyToOne").
- **Ainda não validado contra uma solution real**: o XSD garante XML *válido*, não o que o
  Studio de fato escreve numa exportação real (campos opcionais que às vezes aparecem, às
  vezes não). Documentado como `[LACUNA]` explícita no FORMAT-NOTES — revisitar quando uma
  solution real com tabela custom aparecer.
- **Coluna calculada detectada por presença de `CalculationOf`/`FormulaDefinitionFileName`**,
  não pelo campo `SourceType` (inteiro sem significado documentado no XSD) — sinal direto em
  vez de decodificar um enum não documentado.
- **Chave primária da entidade referenciada inferida como `<nome lógico>id`**: não aparece
  nos campos do `EntityRelationship`, mas é uma regra fixa e documentada da plataforma
  Dataverse (toda tabela tem PK com esse padrão de nome), não uma suposição sobre este
  arquivo específico.
- **`crossFilter` e `isActive` sempre `"single"`/`true`** pra relacionamento Dataverse: o
  formato não tem equivalente a esses conceitos (que são de DAX/Power BI); os campos do IR
  exigem um valor, sem sinal real por trás no Dataverse.
- **Reaproveitar o `DataModel` do IR em vez de criar um tipo novo**: tabelas Dataverse e
  tabelas de um modelo Power BI são estruturalmente a mesma coisa pro que o Power Lens
  precisa mostrar (tabela, coluna, tipo, relacionamento) — confirmado na prática: o mesmo
  `MerView`/`MeasuresPanel` já construído na Fase 3 funcionou sem nenhuma alteração ao
  carregar uma solution com tabelas custom no browser.

## Arquivos principais

- `packages/core/src/parsers/solution/customizations-xml.ts`
- `packages/core/src/parsers/solution/{parse,raw-shapes}.ts`
- `fixtures/synthetic/solution-minimal/customizations.xml`
- `packages/core/test/parsers/solution.test.ts`
- `docs/FORMAT-NOTES.md` (seção 2.1)
