# Sidebar de navegação, sub-abas por artefato e ícones Fluent

## O quê

- `apps/web/src/components/DocumentView.tsx`: a navegação principal deixou de ser uma
  `TabsList` horizontal no topo e virou uma sidebar vertical (Resumo, Fluxos, Modelos de
  dados, Apps, Diagnósticos, Documentação — cada uma só aparece se houver algo daquele tipo).
  Fluxo/modelo/app deixaram de ser uma guia geral por artefato; agora "Fluxos" é uma página e,
  só quando há mais de um fluxo, ela ganha uma sub-navegação em abas horizontais dentro dela
  (`ArtifactTabs`, componente genérico reaproveitado pra fluxos/modelos/apps). Com um único
  artefato daquele tipo, mostra o conteúdo direto, sem aba redundante.
- `apps/web/src/lib/artifact-name.ts`: `shortArtifactName()` — artefatos de dentro de uma
  solution vêm nomeados com o caminho completo (`Workflows/ACESSOS_E_LICENAS_...`); as abas e
  listas agora mostram só o último segmento, truncado com `title` pro nome completo no hover.
- `apps/web/src/App.tsx`: container de página trocou de `max-w-6xl` pra `max-w-[1800px]` — a
  sidebar mais o conteúdo (diagramas, tabelas) precisa de mais espaço horizontal do que uma
  pilha de cards centralizada.
- `@fluentui/react-icons` adicionado a `apps/web`. `apps/web/src/components/nav/FormatIcon.tsx`
  mostra na navbar um ícone de acordo com o(s) tipo(s) de artefato do documento carregado
  (fluxograma pra Cloud Flow, banco de dados pra modelo, app genérico pra Canvas App, gráfico
  pra Report, peça de quebra-cabeça quando a solution mistura mais de um tipo). O logo "Power
  Lens" no navbar usa `SearchSparkleColor` (ícone colorido do Fluent) como marca temporária.

## Por quê

Testado pelo usuário com um solution.zip real (49 artefatos, 48 fluxos) — a barra de abas
horizontal no topo virava uma fita inteira de "Fluxo: Workflows/NOME-GUID-GUID..." ilegível e
sem hierarquia. Pedido explícito: sidebar como "páginas diferentes", cada fluxo como
sub-navegação dentro da página de fluxos (não misturado com as guias gerais), nome curto
truncado, e um ícone indicando o tipo de arquivo — com Fluent System Icons como sugestão de
biblioteca por já ser a linguagem visual (Fluent 2026) escolhida pra direção do app.

## Decisões

- **Bug real de CSS descoberto no meio do incremento**: a primeira versão manteve a sidebar
  como um `Tabs` do shadcn com `orientation="vertical"`. Só que o mesmo componente é reusado
  *dentro* do `TabsContent` de "Fluxos" pra montar a sub-navegação horizontal — e os dois
  `Tabs` (externo vertical, interno horizontal) compartilham o mesmo nome de grupo Tailwind
  (`group/tabs`). Seletores como `group-data-vertical/tabs:flex-col` casam com *qualquer*
  ancestral `.group/tabs[data-orientation=vertical]`, não só o mais próximo — então o estilo
  "empilhado" do `Tabs` externo vazava pro `TabsList` interno, que renderizava como lista
  vertical estreita em vez de pílulas horizontais. Só apareceu testando no browser com um
  fixture real de múltiplos fluxos; `typecheck`/`test` não pegam isso. Resolvido trocando a
  sidebar por uma `nav` comum (botões simples) controlando `value`/`onValueChange` do `Tabs`
  por fora — sem `TabsList` externo, não tem `group/tabs` vertical pra vazar. Documentado como
  comentário no código (`SidebarLink`) pra não se repetir se alguém tentar "simplificar" de
  volta pra `TabsTrigger`.
- **Ícone por tipo, não por `detectedFormat` bruto**: `detectedFormat: "solution"` sozinho não
  diz se é um app, um fluxo ou os dois — o ícone é calculado a partir dos `kind`s realmente
  presentes em `document.artifacts` (um só tipo → ícone daquele tipo; mais de um → peça de
  quebra-cabeça "solução mista"; nenhum reconhecido → caixa genérica).
- **`@fluentui/react-icons` só pros dois usos pedidos** (logo + ícone de formato), não uma
  migração geral do `lucide-react` já usado no resto da UI — não foi pedido e trocaria ícone
  por ícone sem ganho, só custo de revisão. Os nomes exportados vieram sem sufixo de tamanho
  numérico (`FlowchartRegular`, não `Flowchart24Regular`) porque essa versão do pacote
  (`^2.0.341`) exporta os ícones em escala `1em`/CSS em vez de variantes fixas por pixel —
  confirmado direto nos `.d.cts` do pacote antes de importar, pra não adivinhar nome de ícone
  e quebrar o build.
- **`SearchSparkleColor` é explicitamente temporário** (pedido do usuário) — não é uma marca
  definitiva do projeto, só o que ocupa o lugar do logo até haver um de verdade.

## Arquivos principais

- `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/components/nav/{Navbar,FormatIcon}.tsx`
- `apps/web/src/lib/artifact-name.ts`
- `apps/web/src/App.tsx`
- `apps/web/package.json` (`@fluentui/react-icons`)
