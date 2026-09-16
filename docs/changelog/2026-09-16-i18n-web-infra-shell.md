# i18n em apps/web: infra + shell (nav, import flow, App.tsx)

## O quê

Quinto incremento (primeiro em `apps/web`): novo módulo `apps/web/src/lib/i18n/`
(`locale.ts` reexportando `Locale`/`DEFAULT_LOCALE` do `@power-lens/core`, `storage.ts`
com o mesmo padrão de `lib/ai/settings-storage.ts` — chave `"power-lens:locale"`,
try/catch silencioso —, `translations/{en,pt,es}.ts` com a mesma shape via `satisfies`, e
`context.tsx` com `I18nProvider`/`useI18n()`). Sem detecção de `navigator.language`: sem
nada salvo, o default é sempre `DEFAULT_LOCALE` ("en"). O provider entra em `main.tsx` (ao
lado do `ThemeProvider` já existente) e sincroniza `<html lang>` com o locale atual;
`index.html` também mudou o `lang` estático de `"pt-BR"` pra `"en"` (o valor antes do JS
hidratar).

Tradução de todo o "shell" do app e do fluxo de import: `nav/{Navbar,Sidebar,ThemeToggle}`,
`HomeSection`, `Dropzone`, `LoadingState`, `MobileGate`, `ConfirmDialog`, `App.tsx`,
`lib/analyze.ts`.

**Fio de locale ponta a ponta** (o que faz a tradução ter efeito de verdade, não só trocar
label): `analyzeFile` ganhou `options.locale`, repassado pra `detectFormat`/parser
escolhido/`runHealthChecks` (que já aceitavam `locale` desde os incrementos em
`packages/core`); `useDocumentDownloads` ganhou um segundo parâmetro `locale`, repassado
pra `renderMarkdown`. `AppState` (variante `"parsed"`) ganhou o campo `file: File` — guarda
o arquivo original em memória especificamente pra poder re-rodar a análise depois. `App.tsx`
tem um `useEffect` que observa `locale` e, se já há um documento carregado
(`state.status === "parsed"`), re-roda `analyzeFile(state.file, { locale })` e substitui o
resultado quando resolve — assim, trocar de idioma depois de importar atualiza diagnósticos
e documentação junto, sem precisar reimportar.

## Por quê

Continuação da tradução do site pedida pelo usuário — este incremento é o que liga a UI
(menus, diálogos, fluxo de import) ao idioma escolhido, e é também o que faz o trabalho já
feito em `packages/core` (regras, parsers, Markdown, pacote de contexto — incrementos 1 a 4)
realmente aparecer traduzido na tela.

## Decisões

- **Correção de um bug pré-existente, não relacionado**: `App.tsx` já passava
  `onRequestImport` pra `<Sidebar>`, mas `SidebarProps` não declarava esse campo (erro de
  typecheck que já existia no working tree antes deste incremento, de um WIP anterior do
  usuário). Corrigido de passagem — `Sidebar` recebe e guarda a prop (ainda sem uso na UI;
  o rodapé de configurações que vai consumi-la é um incremento futuro) — porque bloqueava o
  gate `pnpm typecheck` da raiz pra qualquer commit em `apps/web` a partir de agora.
- **Re-análise silenciosa, não um novo "loading"**: o `useEffect` de re-análise por troca de
  idioma não passa por `status: "loading"` — isso desmontaria a sidebar/doc view (causando
  flicker) só pra atualizar texto. Um `latestLocaleRef` evita aplicar um resultado
  desatualizado se o usuário trocar de idioma de novo antes da primeira reanálise terminar.
- **`ThemeToggle` continua na `Navbar`** (só teve o aria-label traduzido) — a intenção é
  mover tema pro rodapé da sidebar num incremento futuro (junto com idioma/reset/créditos),
  mas removê-lo da navbar agora deixaria o app sem controle de tema nenhum entre este commit
  e aquele, o que é pior do que a duplicação temporária.
- Textos com marcação embutida (`<b>Power Platform</b>` no título da Home, nome de arquivo
  em `<strong>` na tela de erro) viraram par `xBefore`/`xAfter` no dicionário em vez de uma
  string única com placeholder — a posição da marca muda de lugar na frase conforme o idioma
  (ex.: "Understand a **Power Platform** artifact" vs. "Entenda um artefato da
  **Power Platform**").

## Arquivos principais

`apps/web/src/lib/i18n/{locale,storage,context}.tsx`,
`apps/web/src/lib/i18n/translations/{en,pt,es}.ts`, `apps/web/src/main.tsx`,
`apps/web/index.html`, `apps/web/src/App.tsx`, `apps/web/src/lib/app-state.ts`,
`apps/web/src/lib/analyze.ts`, `apps/web/src/lib/use-document-downloads.ts`,
`apps/web/src/components/{HomeSection,Dropzone,LoadingState,MobileGate,ConfirmDialog}.tsx`,
`apps/web/src/components/nav/{Navbar,Sidebar,ThemeToggle}.tsx`,
`packages/core/src/index.ts` (exporta `Locale`/`DEFAULT_LOCALE`/`getMessages`/`getRuleRegistry`
pra `apps/web` poder consumir).
