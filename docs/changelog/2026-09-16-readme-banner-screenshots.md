# README, banner e screenshots de demonstração

## O quê

- `README.md` na raiz: resumo do projeto, o problema que ele resolve, lista de features,
  screenshots, explicação da arquitetura (detector → parsers → IR → renderers), stack e
  instruções pra rodar localmente.
- `public/images/banner.png`: banner (1500×500, dimensão de capa do X/Twitter) com o logo,
  "Power Lens" e um subtítulo, sobre o gradiente `from-primary to-sidebar-primary` já usado
  no app.
- `public/screenshots/*.png`: 12 capturas de tela do app cobrindo início, resumo, wireframe
  de app, mapa de navegação, DAG de fluxo, grafo de dependências, diagnósticos,
  documentação gerada, estado vazio da explicação por IA, busca global, modelo de dados
  (MER) e painel de lineage.

## Por quê

Pedido do usuário: preparar o projeto pra virar público (fase 1, antes do lint/build de
produção da fase 2). Um README com contexto e screenshots é o que faz alguém entender o
projeto sem precisar rodar nada.

## Decisões

- **Dados de demonstração são fictícios.** Todas as screenshots usam dois arquivos
  sintéticos construídos localmente com `fflate` (nunca commitados — não fazem parte do
  repo, só existiram no ambiente de captura):
  - Uma solution `.zip` ("Gestão de Compras") combinando `solution.xml` +
    `CanvasApps/*.msapp` + `Workflows/*.json` + `customizations.xml`, montada seguindo
    exatamente o formato que `parseSolution` espera (o mesmo padrão usado em
    `packages/core/test/parsers/solution.test.ts`). Isso faz um único arquivo exercitar
    app + fluxo + tabelas do Dataverse + dependências + boa parte das 15 regras de health
    check ao mesmo tempo (tela órfã, nome default, GUID hardcoded, `OnStart` longo,
    `AccessibleLabel` ausente, conector premium, `Foreach` aninhado, coluna sem uso).
  - Um `.pbit` ("Vendas") com tabelas, relacionamento inativo, medidas DAX e um relatório
    com 3 páginas, pra cobrir a visualização de modelo de dados/relacionamentos e o painel
    de lineage sem misturar com o outro artefato.
  - Antes de gerar as screenshots, os dois arquivos foram validados rodando o parser real
    (`parseSolution`/`parsePbit` + `runHealthChecks` de `@power-lens/core`) num teste
    temporário (não commitado) pra confirmar que os diagnósticos esperados realmente
    disparavam.
- **Idioma das screenshots é inglês** porque é o locale default da UI (`DEFAULT_LOCALE`),
  decisão de produto já registrada em `apps/web/src/lib/i18n/context.tsx`. O README em si
  ficou em português, seguindo o padrão do resto da documentação do projeto
  (`docs/SPEC.md`, `docs/FORMAT-NOTES.md`, changelog).
- **Captura via Playwright** (headless Chromium) contra o `pnpm dev` local, com
  `colorScheme: "light"` fixo pra garantir tema consistente entre screenshots — o app usa
  `next-themes` com `defaultTheme="system"`, que dependeria do ambiente sem essa opção.
- README não inclui seção de licença: não existe `LICENSE` no repo ainda.

## Arquivos principais

- `README.md`
- `public/images/banner.png`
- `public/screenshots/` (12 arquivos)
