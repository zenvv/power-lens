# Fase 10 do plano de novas features: categorização de gatilho de fluxo

## O quê

- `FlowNode.recurrence?: unknown` novo no IR — repasse bruto de
  `trigger.recurrence` (config de agendamento de um trigger
  `type: "Recurrence"`, schema público do Workflow Definition Language),
  populado só na `trigger` de um `CloudFlow`, nunca numa `action`.
- `packages/core/src/analysis/trigger-summary.ts`: `summarizeTrigger(trigger)`
  classifica o gatilho em `"scheduled"` (tem `recurrence`), `"manual"`
  (`Request`/`Manual`), `"event"` (tem `connectorName`) ou `"unknown"` —
  sem gerar texto nenhum, só a categoria + os dados brutos já existentes no
  IR (`type`, `connectorName`, `recurrence`).

## Por quê

Fase 10 do plano de 13 features. Escopo redesenhado em relação ao plano
original: a ideia inicial (uma função que já devolvia frase pronta tipo
"roda todo dia às 9h") foi abandonada depois de ver o retrofit de i18n que
aconteceu em paralelo neste projeto (`packages/core/src/i18n/`, dicionário
EN/PT/ES pra toda mensagem gerada) — gerar prosa aqui exigiria inventar
chaves de tradução pra uma UI que ainda não existe (o painel visual continua
adiado até o redesenho de `apps/web` estabilizar, mesma decisão das Fases
8/9/11/13/16). Categorizar e devolver dado estruturado, deixando o texto
pra quem realmente for renderizar (com o i18n que já existe), separa melhor
"o que é" de "como mostrar" — o mesmo padrão que `resolveScreenLayout`
(wireframe) já usa.

## Decisões

- **`recurrence` extraído mesmo sem confirmação contra arquivo real** — o
  parser de fluxo inteiro já opera nesse regime (schema público, não
  verificado, degrada honesto). Documentado como `[LACUNA]` item 18 do
  `FORMAT-NOTES.md`, mesmo padrão do vínculo fluxo-filho da Fase 13.
- **Sem parsear frequência/intervalo/timezone dentro de `recurrence`** —
  guardado como `unknown` bruto, igual `inputs`. Decodificar esses campos
  someria complexidade sem consumidor ainda (nenhuma UI lê isso hoje);
  quando o painel existir, decide então o que extrair de verdade.
- **Categoria "event" é qualquer trigger com `connectorName`**, sem
  enumerar todo `type` de webhook conhecido (`ApiConnectionWebhook`,
  `OpenApiConnectionWebhook`, `OpenApiConnectionNotification`...) — mais
  robusto a variação de nome de tipo do que uma lista fixa, e o sinal real
  (tem conector = é acionado por outro sistema) já está disponível.

## Arquivos principais

- `packages/core/src/ir/schema.ts` (`FlowNode.recurrence`)
- `packages/core/src/parsers/flow/{raw-shapes,parse}.ts`
- `packages/core/src/analysis/trigger-summary.ts`, `analysis/index.ts`
- `packages/core/test/parsers/flow.test.ts`,
  `packages/core/test/analysis/trigger-summary.test.ts`
- `docs/FORMAT-NOTES.md` (item 18)
