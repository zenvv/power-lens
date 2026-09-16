# Fase 14 (UI) do plano de novas features: comparar duas versões (diff)

## O quê

Fecha o plano de UI inteiro — última das 13 features.

- `apps/web/src/components/diff/CompareDialog.tsx` (novo): diálogo pequeno
  reaproveitando o mesmo `Dropzone` do fluxo de import principal, só pra
  pedir o segundo arquivo. Botão "Compare with another file" novo no
  `SidebarFooter` (só aparece com um documento já carregado, já que
  precisa de uma base "antes").
- `apps/web/src/components/diff/DiffResultPanel.tsx` (novo): agrupa por
  `ArtifactDiff` (badge added/removed/changed + chave `kind:nome`), lista
  cada `DiffEntry` com `path` + `before`/`after` lado a lado (vermelho
  riscado / verde), sem precisar de lib de diff de texto.
- `App.tsx`: `onCompareFile` roda `analyzeFile` (mesmo pipeline do import
  normal, mesmo `locale`/`ruleConfig`) sobre o segundo arquivo e
  `diffDocuments(document, analisado)` (núcleo) sobre o par; novo estado
  `diffResult` — enquanto existir, `DiffResultPanel` substitui o
  `DocumentView` inteiro no lugar de conteúdo principal (não é um
  `SectionId`: não pertence a um artefato específico, é uma visão do
  documento inteiro comparado contra outro), com um botão "Voltar" que
  limpa o estado.

## Por quê

Última peça da sequência de UI, deixada por último de propósito — não
existia nenhum scaffolding pra "dois documentos" no app antes deste
incremento (zero upload de segundo arquivo, zero estado de comparação).

## Decisões

- **Lista plana por `path`, não árvore recursiva** — mesmo ajuste de
  escopo já registrado no plano aprovado: o próprio `path`
  (`screens[Screen1].root.children[HeaderContainer].children[Title1].properties.Text.raw`)
  já comunica a posição exata linearmente; uma árvore visual só
  reconstruiria o que o texto já diz, sem ganho real de legibilidade.
- **Modo à parte, não `SectionId`** — decisão já prevista no plano: o diff
  compara o documento inteiro contra outro, não é conteúdo de uma seção
  específica, então substituir o `DocumentView` inteiro (preservando a
  sidebar do documento base) é mais correto que forçar numa aba.
- **Verificado ao vivo, ponta a ponta**: fixture sintética `msapp-minimal`
  zipada duas vezes (original + uma cópia com `Title1.Text` mudado de
  `"Bem vindo"` pra `"Bem-vindo de volta"`). O diff resultante mostrou
  exatamente essa mudança, path completo incluído, texto antes/depois
  corretos — confirma `diffDocuments` (núcleo, já testado isoladamente na
  Fase 14 do núcleo) funcionando de ponta a ponta com upload real de dois
  arquivos.
- **Reaproveitado o `Dropzone` existente** pro segundo arquivo, sem
  componente de upload novo — mesmo comportamento (clique ou arrastar),
  mesma validação de tipo de arquivo.

## Arquivos principais

- `apps/web/src/components/diff/{CompareDialog,DiffResultPanel}.tsx` (novos)
- `apps/web/src/components/nav/Sidebar.tsx`, `apps/web/src/App.tsx`
- `apps/web/src/lib/i18n/translations/{en,pt,es}.ts` (namespace `diff`)
