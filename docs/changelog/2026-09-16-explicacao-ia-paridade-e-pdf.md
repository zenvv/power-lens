# Explicação por IA: paridade com a Documentação, export em PDF e atalho no Resumo

## O quê

- `AiExplanationCard` agora renderiza o texto gerado com o mesmo `MarkdownDocView` da aba
  "Documentação" (leitura formatada + raw, num só componente), em vez de um bloco de texto
  simples — ganha de graça as abas Leitura/Raw e o botão "Baixar .md".
- `MarkdownDocView` ganhou um botão "Copiar" (copia o markdown inteiro pra área de
  transferência, com feedback visual de "Copiado") e um botão opcional "Baixar PDF"
  (só aparece quando o consumidor passa `onDownloadPdf`) — usado na explicação por IA, não
  na Documentação determinística.
- Export em PDF (`apps/web/src/lib/print-pdf.ts` + `lib/markdown-to-html.tsx`): abre o
  markdown renderizado numa janela nova, isolada, com CSS de impressão próprio, e dispara
  `window.print()` — o usuário salva como PDF pelo diálogo nativo do navegador.
- A descrição da `AiExplanationCard` agora mostra qual provedor, modelo e chave (mascarada,
  só os últimos 4 caracteres) estão configurados — `maskApiKey` em
  `apps/web/src/lib/ai/settings-storage.ts`.
- Atalho "Gerar explicação por IA" na aba Resumo (`DocumentView`): navega direto pra aba de
  IA e, se já houver chave configurada, dispara a geração automaticamente.

## Por quê

Pedido do usuário: a aba de IA estava com uma UX mais pobre que a Documentação (só um bloco
de texto puro, sem raw/copiar/baixar), sem mostrar qual chave estava em uso, e sem um jeito
rápido de chegar lá a partir do Resumo.

## Decisões

- **PDF via `window.print()`, não uma lib de geração de PDF client-side** (ex.: jsPDF): o
  navegador já faz um trabalho melhor de paginação/tipografia pra HTML/Markdown do que
  desenhar texto manualmente numa lib, e evita puxar uma dependência nova só pra isso —
  ainda 100% client-side (spec seção 3), sem servidor nenhum envolvido.
- **Chave mostrada mascarada (só os 4 últimos caracteres), não em texto puro**: confirma
  pro usuário qual chave está ativa sem expor o segredo inteiro na tela (risco em captura
  de tela / compartilhamento de tela).
- **Botão "Baixar PDF" é opt-in via prop no `MarkdownDocView`**: a Documentação
  determinística continua só com Leitura/Raw/Copiar/Baixar .md — PDF é específico da
  explicação por IA porque é o conteúdo mais "para humano ler/compartilhar" dos dois.
- **Atalho do Resumo dispara geração automática só uma vez**: um `armed` boolean em
  `App.tsx` é consumido (resetado) assim que a `AiExplanationCard` monta e usa — navegar
  de volta pra aba de IA depois pela sidebar não regera sozinho.

## Nota — inclui trabalho anterior não commitado

O `MarkdownDocView` (abas Leitura/Raw + baixar `.md` pra Documentação gerada) e a
consequente reescrita da aba "docs" do `DocumentView` já existiam como trabalho local não
commitado antes deste incremento. Como a `AiExplanationCard` passou a depender diretamente
desse componente (reuso, não duplicação — regra de arquitetura do projeto), este commit
inclui os dois de uma vez: não dava pra separar limpo sem quebrar o build.

## Arquivos principais

- `apps/web/src/components/ai/AiExplanationCard.tsx`
- `apps/web/src/components/document/MarkdownDocView.tsx`
- `apps/web/src/lib/print-pdf.ts`, `apps/web/src/lib/markdown-to-html.tsx`
- `apps/web/src/lib/ai/settings-storage.ts`
- `apps/web/src/components/DocumentView.tsx`, `apps/web/src/App.tsx`
