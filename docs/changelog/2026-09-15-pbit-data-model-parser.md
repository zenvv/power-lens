# Parser de .pbit: DataModel a partir de DataModelSchema (TMSL)

## O quê

- Novo parser `parsePbit` em `packages/core/src/parsers/powerbi/`, que lê o
  `DataModelSchema` de um `.pbit` (TMSL) e produz um artefato `DataModel` do IR: tabelas,
  colunas (incluindo calculadas), medidas e relacionamentos.
- Helper `readUtf16LEText` em `packages/core/src/parsers/zip.ts` — `DataModelSchema` (e
  outros arquivos internos do `.pbit`) são UTF-16LE sem BOM, não UTF-8.
- Wiring completo: exportado em `packages/core/src/index.ts`, chamado em
  `apps/web/src/lib/analyze.ts` quando `detectFormat` retorna `"pbit"` (a detecção já
  existia). A UI já ganha a documentação Markdown do modelo de graça — o renderer
  `renderDataModelSection` já existia, esperando um artefato que ninguém ainda produzia.
- Fixture sintética `fixtures/synthetic/pbit-minimal/DataModelSchema.json` + testes em
  `packages/core/test/parsers/pbit.test.ts` (10 casos) cobrindo: tabela/coluna normal,
  coluna calculada, medida com expressão multi-linha, tabela oculta, relacionamento com
  campos omitidos (defaults) e com campos explícitos, e os três modos de degradação
  honesta (zip inválido, `DataModelSchema` ausente, JSON inválido).
- `docs/FORMAT-NOTES.md` seção 6: achados empíricos sobre a estrutura interna de um
  `.pbit` real.

## Por quê

Início da Fase 3 do roadmap (`docs/SPEC.md` seção 10). `docs/FORMAT-NOTES.md` marcava
zero conhecimento empírico sobre Power BI antes deste incremento — parar pra descobrir a
estrutura real antes de escrever o parser é a regra do projeto ("pergunte em vez de
supor" no `CLAUDE.md`).

## Decisões

- **Fonte da verdade sobre o formato**: perguntado ao usuário como confirmar a estrutura
  de `.pbit`/TMSL antes de codar. Resposta: os dois — o usuário forneceu um `.pbit` real
  em `reference/pbi-file-example.pbit` (gitignored) e a doc oficial de TMSL/TOM da
  Microsoft preencheu os campos que o arquivo de exemplo não exercitava (relacionamentos
  sem cardinalidade/cross-filter explícitos, já que todos os relacionamentos do arquivo
  eram gerados automaticamente pelo "Auto date/time" do Power BI Desktop). O parser foi
  validado rodando contra o arquivo real antes de considerar o incremento pronto: 10
  tabelas, 6 relacionamentos, 3 medidas, zero diagnósticos, IR válido.
- **`expression` como string ou array**: medidas, colunas calculadas e a expressão M de
  partições vêm ora como string única, ora como array de strings (uma por linha) — o
  serializador do Power BI Desktop escolhe conforme o tamanho da fórmula. `joinExpression`
  trata os dois casos e junta com `"\n"`. Sem essa checagem o parser quebraria em qualquer
  modelo com fórmula de mais de uma linha, que é o caso comum.
- **Defaults de relacionamento**: `fromCardinality`/`toCardinality` ausentes → assume
  `many`/`one` (muitos-para-um); `crossFilteringBehavior` ausente (`"automatic"`) →
  mapeado para `"single"` no IR, uma aproximação registrada como tal (o `"automatic"` real
  deixa o engine decidir em tempo de consulta, o IR não tem esse terceiro estado);
  `isActive` ausente → `true`. Todos os 6 relacionamentos do arquivo real omitiam esses
  campos, então a fonte é a documentação oficial da Microsoft, não o arquivo — marcado
  como `[LACUNA]` em `docs/FORMAT-NOTES.md` até um `.pbit` real com relacionamento manual
  aparecer.
- **Tabelas ocultas geradas automaticamente** (`LocalDateTable_*`, `DateTableTemplate_*`,
  criadas pelo "Auto date/time"): mantidas no IR como tabelas normais com `isHidden: true`,
  sem filtro no parser — o IR deve refletir o modelo real; esconder isso na visualização é
  decisão de um renderer/health-check futuro, não do parser.
- **Escopo intencionalmente restrito**: só `DataModelSchema` → `DataModel`. `Report/Layout`
  (também UTF-16LE, já teria o parser reaproveitando `readUtf16LEText`) fica para um
  incremento futuro que produza o artefato `Report`. `.pbip` fica de fora porque é uma
  estrutura de pastas-irmãs, não um único zip, e exigiria uma estratégia de upload
  diferente na UI antes de fazer sentido escrever o parser. `.pbix` inalterado (spec já
  cobre a limitação do Xpress9).

## Arquivos principais

- `packages/core/src/parsers/powerbi/{parse,raw-shapes,index}.ts`
- `packages/core/src/parsers/zip.ts` (helper `readUtf16LEText`)
- `packages/core/src/index.ts`, `apps/web/src/lib/analyze.ts`
- `fixtures/synthetic/pbit-minimal/DataModelSchema.json`
- `packages/core/test/parsers/pbit.test.ts`, `apps/web/test/analyze.test.ts`
- `docs/FORMAT-NOTES.md` (seção 6)
