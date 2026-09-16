# Fase 8 do plano de novas features: regras configuráveis (núcleo)

## O quê

`packages/core/src/rules/index.ts` ganhou um registro `RULE_REGISTRY`
(`{ code, label, run, options? }` por regra) no lugar da lista solta
`HEALTH_CHECK_RULES` — que continua existindo, agora derivada do registro,
pra não quebrar quem só queria a lista de funções. `runHealthChecks(doc,
configs?)` aceita um segundo argumento opcional (`RuleConfigMap`, chaveado
por código da regra) pra ligar/desligar uma regra (`enabled: false`) e
repassar limiares customizados (`options`) — sem `configs`, o comportamento
é idêntico ao de antes desta fase (todas ligadas, limiares default).

As duas únicas regras com limiar arbitrário ganharam a opção correspondente:

- `pl005LongOnStart(doc, { maxLines })` — default `MAX_ONSTART_LINES` (25).
- `pl006DuplicateFormula(doc, { minOccurrences })` — default `MIN_OCCURRENCES` (3).

## Por quê

Fase 8 do plano de 13 features novas. Os limiares de PL005/PL006 sempre
foram documentados no próprio código como "arbitrários, não uma verdade
oficial" — dar ao usuário o controle de ajustar (ou desligar uma regra que
não faz sentido pro padrão da equipe dele) transforma o health check de
"opinião fixa do Power Lens" em checklist configurável.

Este incremento cobre só o núcleo (`packages/core`, testável e sem risco).
A tela de configuração em `apps/web` (persistência em localStorage + diálogo
de liga/desliga, como estava no plano) fica pro próximo incremento — ver
nota abaixo.

## Decisões

- **Parei antes de tocar `apps/web`.** Um `git status` no início desta fase já
  mostrava uma quantidade grande de arquivos do `apps/web` (`App.tsx`,
  `Navbar.tsx`, `Sidebar.tsx`, componentes `ui/*`, etc.) modificados e não
  commitados — um redesenho de shell em andamento fora desta sessão, no mesmo
  padrão já registrado no changelog do BYOK ("trabalho concorrente no
  apps/web"). Iniciei a implementação da UI de configuração e percebi, ao
  reler `DocumentView.tsx`/`App.tsx`, que o conteúdo desses arquivos tinha
  mudado desde a leitura anterior na mesma sessão — sinal de edição ativa em
  paralelo. Preferi fechar e commitar a parte seguro/isolada (núcleo em
  `packages/core`) e perguntar ao usuário o momento certo pra tocar
  `apps/web`, em vez de arriscar um wiring que colide com uma tela que está
  sendo redesenhada ao vivo.
- **`RuleOptions` como `Record<string, number>`** — deliberadamente restrito
  a números. As duas regras existentes só precisam de limiar numérico; um
  tipo mais genérico (string, boolean) só seria justificado quando uma regra
  de fato precisar, sem antecipar necessidade hipotética.
- **`HEALTH_CHECK_RULES` mantido como derivado de `RULE_REGISTRY`**, não
  removido — é `readonly HealthCheckRule[]` usado por `test/rules/index.test.ts`
  (`toHaveLength(14)`) e por qualquer consumidor externo que só queira rodar
  as funções sem metadado.

## Arquivos principais

- `packages/core/src/rules/index.ts`
- `packages/core/src/rules/pl005-long-onstart.ts`, `pl006-duplicate-formula.ts`
- `packages/core/test/rules/index.test.ts`, `pl005-long-onstart.test.ts`,
  `pl006-duplicate-formula.test.ts`
