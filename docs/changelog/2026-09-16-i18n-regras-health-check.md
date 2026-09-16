# i18n das regras de health check (PL001–PL015)

## O quê

Novo módulo `packages/core/src/i18n/` (`Locale = "en" | "pt" | "es"`, `DEFAULT_LOCALE = "en"`,
`getMessages(locale)`) e tradução das 15 regras de health check (`rules/pl001..pl015`) —
`message`/`hint` de cada `Diagnostic` agora vêm do dicionário do locale pedido, em vez de
template literal PT hardcoded. `RuleOptions` ganhou `locale?: Locale`; `runHealthChecks`
ganhou um terceiro parâmetro `locale?: Locale`, repassado pra cada regra. Novo
`getRuleRegistry(locale)` retorna `RULE_REGISTRY` com `label`/`options[].label` traduzidos
(o `RULE_REGISTRY` estático continua existindo, agora em inglês — era `DEFAULT_LOCALE`
antigo PT, virou EN pra acompanhar o novo default).

## Por quê

Primeiro incremento de uma feature maior pedida pelo usuário: tradução do site inteiro
(EN/PT/ES, default inglês) incluindo documentação gerada e diagnósticos, não só a UI
estática de `apps/web`. Regras de health check são a fonte de boa parte do texto visível
em diagnósticos, então entram primeiro.

## Decisões

- **Assinatura por opção, não por parâmetro posicional novo**: `locale` entra dentro de
  `RuleOptions` (junto de `maxLines`/`minOccurrences`) em vez de um terceiro parâmetro
  posicional em cada regra — mantém todas as 15 funções assinaláveis ao mesmo tipo
  `HealthCheckRule` sem precisar de parâmetro dummy nas regras sem opções numéricas.
- **`RuleOptions` deixou de ser `Record<string, number>`** e virou um tipo nomeado
  (`{ locale?; maxLines?; minOccurrences? }`) — o index signature genérico não convivia
  com `exactOptionalPropertyTypes` + um campo não-numérico (`locale`); como só 2 regras
  usam opção numérica, tipar nominalmente é mais preciso, sem perda de flexibilidade (nada
  em `apps/web` indexa `RuleOptions` dinamicamente).
- **PL013 tinha um teste "farejando" o idioma da mensagem** (`message.includes("Tabela")`
  pra distinguir diagnóstico de tabela vs. coluna) — trocado pelo discriminante estrutural
  que já existia (`severity`: `"warning"` pra tabela, `"info"` pra coluna), já que esse
  filtro quebraria silenciosamente com qualquer locale diferente de PT.
- **PL014 tinha asserts em `"bidirecional"`/`"muitos-para-muitos"`** — passam `{ locale: "pt" }`
  explícito em vez de reescrever pra inglês, minimizando diff nos testes existentes.
- Novo `test/rules/i18n.test.ts`: cobertura mínima de que os três dicionários produzem
  texto distinto e que `locale` atravessa `runHealthChecks` até a regra individual.

## Arquivos principais

`packages/core/src/i18n/{locale,index}.ts`, `packages/core/src/i18n/messages/{en,pt,es}.ts`,
`packages/core/src/rules/index.ts`, `packages/core/src/rules/pl001..pl015-*.ts`,
`packages/core/test/rules/{i18n,pl013-unused-model-entity,pl014-risky-relationship-shape}.test.ts`.
