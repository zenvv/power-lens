# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React 18 + TypeScript. Tailwind CSS v4 (CSS-first config em `src/index.css`,
sem `tailwind.config.js`) + shadcn/ui (preset "Nova", tema neutral, dark mode via
classe `.dark`). `@xyflow/react` + `elkjs` para os diagramas (DAG de fluxo, MER de
modelo de dados). `lucide-react` e `@fluentui/react-icons` para ícones. `sonner`
disponível para toasts. Monorepo pnpm workspaces: este app (`apps/web`) consome
`packages/core` (parsers + IR + regras, zero DOM) — nenhum código de UI abre zip,
lê YAML ou conhece a estrutura de um arquivo da Power Platform; tudo passa pelo IR.

## Users

Quem precisa entender um app canvas, um fluxo (cloud flow) ou um modelo de dados da
Power Platform que **não escreveu** — sem abrir o Studio, sem ambiente, sem licença
e sem subir o arquivo pra lugar nenhum. Perfis típicos: dev/consultor herdando um
projeto, alguém fazendo code review de uma solution exportada, alguém documentando
um sistema legado antes de decidir se mexe nele.

## Product Purpose

Dado um artefato exportado da Power Platform (`.msapp`, solution `.zip`, definição
de flow, `.pbit`/`.pbip`/`.pbix`), produzir em um só lugar: resumo estrutural
legível, visualização adequada ao tipo (MER pra modelos, DAG pra fluxos,
wireframe/árvore pra apps canvas), documentação exportável (Markdown) gerada
deterministicamente, health check estrutural (avisos, não correções) e um pacote
de contexto pronto pra um LLM ler. Sucesso = o usuário entende o artefato mais
rápido do que abrindo o Studio, sem nenhum dado saindo da máquina dele.

## Positioning

100% client-side: todo o parsing roda no browser, nenhum arquivo sai da máquina do
usuário, deploy é estático. Determinístico por padrão — toda a extração e a
documentação base funcionam sem IA; IA (BYOK — chave do próprio usuário, chamada
direta pro provedor) é uma camada opcional em cima, nunca o caminho principal. Não
é um builder, não é editor, nunca escreve de volta no artefato original, não é
emulador de Power Fx, não substitui o App Checker/Solution Checker da Microsoft.

## Operating Context

Fluxo de uso é sessão única e local: usuário chega, solta/seleciona um arquivo,
o app detecta o formato, faz o parse no browser e mostra o resultado. Sem conta,
sem login, sem backend, sem telemetria. Depois de carregado funciona offline
(exceto a chamada opcional de LLM, que é direta do browser pro provedor). Um
documento carregado por vez — trocar de arquivo é uma ação deliberada que descarta
a análise atual, então merece confirmação antes de perder o que já foi carregado.
Health check e diagnósticos de parsing aparecem misturados pro usuário (mesma
lista), mesmo vindo de fontes internas diferentes.

## Capabilities and Constraints

- Parsers cobrem: `.msapp` (canvas app), solution `.zip` (pode render N artefatos —
  apps, flows, modelo de dados via Dataverse), definição de cloud flow, `.pbit`/
  `.pbip` (modelo de dados + medidas), `.pbix` (suporte parcial).
- Degradação honesta: quando algo não dá pra extrair, a UI deve dizer o que falta e
  por quê — nunca mostrar uma seção vazia sem explicação.
- Wireframe de canvas app é um blueprint estático por tela (valores literais/
  aritmética constante resolvidos, resto vira placeholder tracejado "dinâmico"),
  não uma simulação do app rodando.
- Exportações possíveis a partir de um documento analisado: Markdown de
  documentação, IR bruto (`ir.json`), pacote de contexto (`.zip`) pra LLM.
- Nenhuma dependência que exija servidor, build step de servidor ou variável de
  ambiente em runtime — restrição dura de arquitetura, não só de produto.

## Brand Commitments

Nome do produto: "Power Lens". Sem ativos de marca fixos além disso — sem logo
formal, favicon ou paleta definidos como compromisso; o ícone atual (lupa/sparkle,
`SearchSparkleColor` do Fluent) e a fonte Geist Variable são decisões de
implementação, não compromissos de marca. Identidade visual está **aberta pra
mudar** neste redesign, incluindo ícone e tratamento do wordmark.

## Evidence on Hand

Sem dados reais de usuário, testimonials, cases ou métricas de produto — projeto
open source recente, sem base de usuários documentada. `docs/SPEC.md` e
`docs/FORMAT-NOTES.md` são a fonte de verdade sobre formato e arquitetura; não
inventar capacidades além do que está ali. Nenhum arquivo de `fixtures/real/` pode
ser referenciado ou commitado (dados reais de artefatos de clientes).

## Product Principles

1. **Client-side only, sem exceção.** Nenhuma decisão de produto ou UI pode
   depender de enviar o arquivo do usuário pra qualquer lugar.
2. **IR-first.** Toda superfície visual consome o IR (`PowerLensDocument`), nunca
   o arquivo bruto — inclusive novas seções de UI.
3. **Determinístico por padrão, IA como camada opcional.** A experiência principal
   nunca deve exigir chave de API pra funcionar.
4. **Degradação honesta > vazio silencioso.** Falha de extração é comunicada, não
   escondida.
5. **Confiança antes de ambição.** É uma ferramenta pra entender artefatos de
   terceiros/legado — a UI precisa parecer confiável e precisa, não chamativa à
   toa.

## Accessibility & Inclusion

Sem requisito formal certificado. Padrão razoável: contraste AA, foco visível e
navegável, navegação completa por teclado.
