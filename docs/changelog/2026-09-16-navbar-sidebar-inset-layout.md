# Navbar/sidebar em layout "inset" (estilo shadcn sidebar-08)

## O quê

- `apps/web/src/App.tsx`, `apps/web/src/components/nav/{Navbar,Sidebar}.tsx`:
  navbar, sidebar e o fundo geral da página agora compartilham a cor `bg-sidebar`; só o
  painel de conteúdo (a área que muda por seção) fica com `bg-background`, com
  padding/margem da borda da página, borda e `rounded-lg` — flutuando sobre o fundo em
  vez de ocupar a página inteira. A navbar perdeu a borda inferior; a sidebar perdeu a
  borda direita (ambas desnecessárias agora que a separação visual vem do painel de
  conteúdo).
- Navbar: virou um grid de 3 colunas (`auto_1fr_auto`) em vez de flex com `ml-auto`, pra
  centralizar de verdade o grupo do meio independente da largura dos grupos das pontas.
  O grupo central mostra o arquivo carregado num `InputGroup` (visual de campo de busca)
  junto do botão "Importar arquivo" (que antes só existia como item da sidebar). O grupo
  da direita ganhou "Baixar Doc", "Baixar IR" e "Abrir IA" (em destaque, `variant="default"`)
  entre o botão de diagnósticos e o de tema.
- `apps/web/src/lib/use-document-downloads.ts` (novo): hook que centraliza
  `renderMarkdown` + os handlers de download de Markdown/IR — usado tanto pelos atalhos
  da navbar quanto pelo card "Exportar" do Resumo (`DocumentView`), que antes calculava
  isso por conta própria.
- Sidebar: item "Importar arquivo" removido (migrou pra navbar) — junto foram a prop
  `onRequestImport`, a função interna que a chamava e o import não usado de `UploadCloud`.

## Por quê

Pedido do usuário: replicar o padrão "inset sidebar" do shadcn (referência: exemplo
`sidebar-08`) e mover "arquivo atual" + "Importar arquivo" pro centro da navbar, com
atalhos de exportação/IA à direita — reduz a distância entre "estou vendo este
documento" e as ações mais comuns (trocar de arquivo, exportar, abrir IA), que antes só
existiam dentro da sidebar ou dentro da aba Resumo.

## Decisões

- **Grid de 3 colunas na navbar, não flex + `ml-auto`**: com flex, um `mx-auto` no grupo
  central compete pelo espaço livre com o `ml-auto` do grupo da direita (ambos são
  margens automáticas disputando o mesmo espaço), o que não centraliza de verdade quando
  os grupos das pontas têm larguras diferentes. Um grid `auto_1fr_auto` isola o grupo
  central na coluna do meio, centralizado ali independente do conteúdo dos vizinhos.
- **"Abrir IA" da navbar não arma a auto-geração** (diferente do atalho já existente no
  card "Explicação por IA" do Resumo, que arma `aiAutoGenerateArmed`): é só navegação
  pra aba de IA (`onOpenAi`), separado de `onRequestAiExplanation`. Um clique rápido pra
  "ver a aba" não devia disparar geração automática se já houver uma chave configurada.

## Arquivos principais

- `apps/web/src/App.tsx`
- `apps/web/src/components/nav/Navbar.tsx`
- `apps/web/src/components/nav/Sidebar.tsx`
- `apps/web/src/lib/use-document-downloads.ts`
