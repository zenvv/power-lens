# i18n do pacote de contexto (PROMPT.md/README.txt)

## O quê

Quarto e último incremento da tradução em `packages/core`: `buildPromptMd` e o
`buildReadme` interno de `render/context-pack.ts` ganham `locale: Locale = DEFAULT_LOCALE`
e usam `getMessages(locale).contextPack.*` em vez da prosa PT hardcoded. `buildContextPack`
repassa o mesmo `locale` pros quatro arquivos que gera (`ir.json` não muda — é a IR crua;
`summary.md` via `renderMarkdown`, `PROMPT.md` via `buildPromptMd`, `README.txt` via
`buildReadme`, todos no mesmo idioma).

## Por quê

Fecha a tradução de tudo que `packages/core` gera como texto: regras (incremento 1),
diagnósticos de parser (incremento 2), documentação Markdown (incremento 3) e agora o
pacote de contexto pra IA (spec seção 9) — o download "pacote de contexto (.zip)" do
Resumo passa a sair inteiro no idioma escolhido.

## Decisões

- `readmeTitle`/`readmeBody` ficaram separados no dicionário (em vez de uma string única)
  porque o README original tem um sublinhado de `=` do tamanho exato do título
  (`"Power Lens — pacote de contexto\n================================"`) — títulos têm
  comprimento diferente em cada idioma, então o sublinhado é calculado em código
  (`"=".repeat(title.length)`) a partir do `readmeTitle` traduzido, não hardcoded em cada
  locale.
- Nenhum teste de `context-pack.test.ts` precisou de ajuste — os asserts existentes só
  checam a lista de arquivos no zip e a presença do nome do arquivo fonte, não texto PT.

## Arquivos principais

`packages/core/src/i18n/messages/{en,pt,es}.ts` (namespace `contextPack` novo),
`packages/core/src/render/context-pack.ts`.
