# Redesign do shell inspirado no Power Platform admin center

## O quê

- Shell do app reestruturado: barra superior compacta e sólida (`Navbar`) + navegação
  lateral persistente (`Sidebar`, novo) + área de conteúdo — no lugar do layout anterior
  (navbar + `Dropzone` centralizado numa tela isolada, `DocumentView` com sua própria
  navegação interna).
- **"Importar arquivo" virou o primeiro item da navegação lateral**, sempre montado, em vez
  de uma página de import separada. Antes de qualquer arquivo carregado, é o único item
  ativo; depois de carregado, os demais itens aparecem abaixo, agrupados em "Análise"
  (Resumo, Fluxos, Modelos de dados, Apps, Diagnósticos) e "Saída" (Documentação, Explicação
  por IA) — mesma estrutura de grupos com contagem do rail do admin center.
- **Trocar de arquivo com uma análise já carregada agora pede confirmação**
  (`ConfirmDialog`, novo componente genérico reutilizável) antes de descartar a visualização
  atual.
- **Tela de loading rápida** (`LoadingState`, novo) ao carregar um arquivo: ícone + nome do
  arquivo + aviso de que tudo roda no navegador. Sem progresso por etapas falso — o parsing
  é quase instantâneo pra maioria dos arquivos, e simular etapas seria degradação honesta
  às avessas.
- **Sidebar responsiva**: em telas estreitas vira um drawer (`Menu` na navbar abre/fecha,
  com backdrop), em vez de espremer o conteúdo — o layout anterior não tinha nenhum
  tratamento pra mobile.
- `DocumentView.tsx` perdeu a navegação interna (agora controlada de fora, via prop
  `activeSection`) e ganhou três componentes extraídos e reutilizáveis, em
  `apps/web/src/components/document/`: `ArtifactTabs` (sub-abas por artefato, já existia
  inline), `SectionHeader` (título + descrição de seção, padrão "Security overview" do
  admin center) e `StatTile` (card de métrica curta — fileira de fatos rápidos no Resumo).
- `apps/web/PRODUCT.md`: criado via `/impeccable init`, captura contexto de produto durável
  (usuários, princípios, stack) pra guiar este e futuros trabalhos de design.

## Por quê

Pedido explícito do usuário: redesign pesado do app lembrando o Power Platform admin
center (screenshots anexadas como referência), com foco em dar mais destaque à importação
sem virar uma página à parte, dialogs de confirmação, loading rápido, liberdade total de
layout, e componentizar padrões repetidos do `DocumentView`.

## Decisões

- **Direção fixada pelo brief, sem sorteio de conceito**: o usuário já trouxe referências
  visuais concretas (screenshots do admin center) e pediu explicitamente pra seguir aquela
  linha — o fluxo `/impeccable new-work` trata isso como direção pinada pelo usuário, que
  sempre vence o sorteio de conceito padrão da skill.
- **Identidade visual (nome "Power Lens" + ícone atual) ficou aberta pra mudar** segundo o
  usuário (pergunta feita durante o `/impeccable init`), mas o redesign acabou preservando
  nome e ícone — o pedido era de estrutura/layout, não de rebrand, e trocar o ícone sem um
  motivo concreto teria sido mudança por mudança.
- **Acessibilidade sem meta formal**: padrão razoável (contraste AA, foco visível, teclado),
  confirmado com o usuário — sem requisito de WCAG certificado.
- **Um único rail de navegação, não dois níveis como no admin center real**: o admin center
  tem um rail de ícones (Home/Manage/Security/...) *mais* uma lista com label por produto;
  Power Lens é uma ferramenta de documento único, então replicar os dois níveis seria
  navegação redundante. A lista com grupos e contagem (segundo nível do admin center) foi o
  padrão adotado; o rail de ícones global não fazia sentido aqui.
- **Ação de resetar/trocar arquivo mora só na sidebar**, não duplicada na navbar (o layout
  anterior tinha um botão "Analisar outro arquivo" na navbar) — evita dois lugares pra
  mesma ação destrutiva.
- **Cards de métrica (`StatTile`) na aba Resumo**, em vez dos números soltos dentro de um
  único `Card`: é o padrão dominante do admin center (fileira de cards "204 site(s)", "91
  site(s)"...) e o brief pediu explicitamente pra seguir essa referência.
- **Sem dados reais de teste commitados**: pra validar visualmente (screenshots via
  Playwright ad-hoc, mesmo approach do incremento anterior — sem `chromium-cli`/skill de run
  disponível), zipei fixtures sintéticas já existentes em `fixtures/synthetic/` (app + flow +
  solution) num `.zip` temporário fora do repo, só pra exercitar Resumo/Fluxos/Modelos/
  Apps/Diagnósticos/Documentação/IA com múltiplos artefatos, claro e escuro, desktop e
  mobile (drawer aberto/fechado). Nada disso foi commitado.
- Rodei o detector mecânico da skill Impeccable (`detect.mjs`) sobre os arquivos alterados:
  nenhum achado.

## Arquivos principais

- `apps/web/src/App.tsx` — orquestração do shell, estado de seção ativa, dialog de confirmação
- `apps/web/src/components/nav/Sidebar.tsx` (novo), `apps/web/src/components/nav/Navbar.tsx`
- `apps/web/src/components/HomeSection.tsx`, `apps/web/src/components/LoadingState.tsx`,
  `apps/web/src/components/ConfirmDialog.tsx` (novos)
- `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/components/document/{ArtifactTabs,SectionHeader,StatTile}.tsx` (novos)
- `apps/web/src/lib/{app-state,artifact-groups}.ts` (novos)
- `apps/web/PRODUCT.md` (novo)
