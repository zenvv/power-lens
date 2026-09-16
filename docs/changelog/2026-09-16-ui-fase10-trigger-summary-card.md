# Fase 10 (UI) do plano de novas features: card de gatilho do fluxo

## O quê

- `apps/web/src/components/flow/FlowTriggerSummary.tsx` (novo): card
  compacto acima do `FlowDagView`, dentro do `ArtifactTabs` da aba "Fluxos".
  Usa `summarizeTrigger(trigger)` (núcleo) pra escolher ícone
  (`Clock`/`MousePointerClick`/`Webhook`/`HelpCircle`) e monta a frase final
  aqui na UI — inclusive a leitura defensiva de `summary.recurrence`
  (`frequency`/`interval`, ainda `unknown` no tipo) pra "roda a cada N
  dia(s)/semana(s)/..." quando os campos batem, caindo no texto genérico
  "roda numa agenda" quando não.
- `lib/i18n/translations/{en,pt,es}.ts`: namespace `flow.trigger` novo
  (`scheduled`, `scheduledWithSchedule`, `manual`, `event`, `eventGeneric`,
  `unknown`, `frequency.{minute,hour,day,week,month}`).
- `lib/i18n/context.tsx`: `Translations` (antes só interno ao módulo) agora
  exportado — precisava do tipo pra montar a frase fora de um componente que
  chama `useI18n()` diretamente.

Fecha a Fase 10 da camada de UI (núcleo já pronto desde
`2026-09-16-trigger-fase10-categorizacao.md`).

## Por quê

Segunda peça da sequência de UI (ver plano aprovado) — pequena, sem estado
novo em `App.tsx`, só consumindo o que o núcleo já classificava.

## Decisões

- **Texto final montado na UI, não no núcleo** — decisão já registrada
  desde a Fase 10 do núcleo: `summarizeTrigger` só categoriza e repassa dado
  bruto, de propósito, justamente pra deixar a frase (que precisa de i18n)
  pra quem renderiza. Este incremento é exatamente essa peça que faltava.
- **Verificado ao vivo contra os três casos reais**: um `Recurrence` com
  `frequency`/`interval` de verdade ("Runs every 3 day(s)"), um `Request`
  manual ("Runs on demand...") e o fixture sintético `flow-minimal`
  (webhook SharePoint, "Runs when an event happens in sharepointonline") —
  os três renderizaram corretamente no browser, ícone e frase batendo com a
  categoria.
- **`FlowDagView` não precisou de ajuste de layout**: já define sua própria
  altura (`style={{ height: "70vh" }}`), então empilhar o card acima dele
  num `flex flex-col` simples não colapsa nem estica nada.

## Arquivos principais

- `apps/web/src/components/flow/FlowTriggerSummary.tsx` (novo)
- `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/lib/i18n/{context.tsx,translations/{en,pt,es}.ts}`
