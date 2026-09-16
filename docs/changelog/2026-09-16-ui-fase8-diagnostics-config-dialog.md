# Fase 8 (UI) do plano de novas features: diálogo de configuração de regras

## O quê

- `apps/web/src/lib/rules/rule-config-storage.ts` (novo): `loadRuleConfig`/
  `saveRuleConfig`/`clearRuleConfig`, espelhando exatamente
  `lib/ai/settings-storage.ts` — localStorage key `power-lens:rule-config`,
  `try/catch` em tudo.
- `apps/web/src/components/rules/RuleConfigDialog.tsx` (novo): `Dialog`
  listando `getRuleRegistry(locale)` — um `Switch` por regra, e um
  `Input type="number"` por opção (`PL005`/`PL006`) quando a regra está
  ligada. Recarrega do storage a cada abertura, salva/reseta e devolve a
  config pro chamador.
- Botão "Health check rules" novo no `SidebarFooter` (mesmo grupo de
  reset/idioma/tema), sempre visível — configurar regra não depende de ter
  documento carregado.
- `analyze.ts`: `AnalyzeOptions` ganhou `ruleConfig?: RuleConfigMap`,
  repassado pra `runHealthChecks(document, ruleConfig, locale)` (antes
  chamado com `undefined` fixo).
- `App.tsx`: novo estado `ruleConfig` (inicializado do storage); o efeito
  que antes só re-rodava a análise inteira quando o idioma mudava agora
  também reage a mudança de config de regra (`useEffect([locale, ruleConfig])`),
  reaproveitando o mesmo padrão de refresh silencioso já usado pra idioma —
  troquei o guard de corrida de "só idioma" (`latestLocaleRef`) por um
  contador de request genérico (`latestRequestRef`), já que agora duas
  fontes diferentes podem disparar uma reanálise.

Fecha a Fase 8 do plano de UI (a parte de núcleo já estava pronta desde
`2026-09-16-health-check-fase8-regras-configuraveis-core.md`).

## Por quê

Primeira peça da camada de UI pras 13 features entregues no núcleo — a mais
isolada e de menor risco, escolhida pra abrir a sequência (ver plano
aprovado). Builder ganha controle real sobre quais regras rodam e com que
limiar, sem precisar editar código.

## Decisões

- **Reusar o padrão de refresh de idioma tal e qual**, em vez de um caminho
  separado de "só re-rodar health check sem reparsear" — mesmo raciocínio
  já registrado como decisão no plano: menos código, um único padrão de
  re-análise no app inteiro, custo de reparsear é desprezível.
- **Verificado ao vivo no browser** (Playwright headless, já que
  `chromium-cli` não estava disponível neste ambiente): upload da fixture
  sintética `msapp-minimal`, PL002 e PL007 apareceram nos diagnósticos;
  desligar PL002 no diálogo e salvar fez o diagnóstico sumir da lista sem
  reimportar o arquivo — confirma o fim-a-fim (dialog → storage →
  `App.tsx` → `analyzeFile` → `runHealthChecks`) funcionando de verdade, não
  só typecheck.
- **Achado durante a verificação, não corrigido**: `apps/web/src/components/ui/button.tsx`
  (regenerado em algum ponto do redesenho paralelo, preset novo com
  `Slot.Root` de `radix-ui`) não usa mais `React.forwardRef` — todo
  `<DialogTrigger asChild><Button>` no app (incluindo o `AiSettingsDialog`
  já existente, não só o `RuleConfigDialog` novo) dispara um warning de
  "Function components cannot be given refs" no console. Já tinha sido
  corrigido antes (`2026-09-15-byok-ai.md`), aparentemente perdido numa
  regeneração do componente shadcn. Não mexi nele porque é um arquivo
  compartilhado sob edição ativa do usuário — o dialog abre e funciona
  normalmente apesar do warning (`Slot.Root` da versão nova do `radix-ui`
  tolera a ausência de ref), mas vale corrigir (`React.forwardRef` de novo)
  numa próxima passada.

## Arquivos principais

- `apps/web/src/lib/rules/rule-config-storage.ts` (novo)
- `apps/web/src/components/rules/RuleConfigDialog.tsx` (novo)
- `apps/web/src/components/nav/Sidebar.tsx`, `apps/web/src/App.tsx`,
  `apps/web/src/lib/analyze.ts`
- `apps/web/src/lib/i18n/translations/{en,pt,es}.ts` (`sidebarFooter.rules`,
  namespace `ruleConfig`)
