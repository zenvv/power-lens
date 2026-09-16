# Rodapé de configurações na sidebar (reset, idioma, tema, créditos)

## O quê

Nono e último incremento da feature: rodapé fixo (`mt-auto`) no fim da `Sidebar`, com,
nesta ordem — pedido explícito do usuário:

1. **Resetar dados** — reusa o mesmo `onRequestImport`/`ConfirmDialog` já existente na
   navbar (mesmo efeito: descarta a análise atual, volta pra tela de importação); fica
   desabilitado quando não há documento carregado.
2. **Idioma** — dropdown (`DropdownMenuRadioGroup`) com EN/PT/ES, troca `useI18n().locale`.
3. **Tema** — upgrade do antigo `ThemeToggle` (só alternava claro/escuro) pra um dropdown de
   3 vias claro/escuro/sistema, usando `next-themes` diretamente (já suportava `"system"`,
   nada mudou no provider).
4. **Power Lens on GitHub** — link externo pra `https://github.com/zenvv/power-lens`.

Instalado `apps/web/src/components/ui/dropdown-menu.tsx` via `npx shadcn@latest add
dropdown-menu` (não existia no projeto ainda). `ThemeToggle.tsx` foi removido — ficou sem
nenhum uso depois que o controle de tema mudou de lugar (navbar → rodapé da sidebar).

## Por quê

Fecha o pedido original do usuário: "bota no footer da sidebar" essas quatro configurações,
nessa ordem, junto com o `defaultLang="en"` e a tradução do resto do site (incrementos
1-8).

## Decisões

- **"Resetar dados" não abre um diálogo próprio** — reusa a mesma confirmação de "Importar
  outro arquivo?" já cravada na navbar, porque o efeito é idêntico (`resetToIdle`) e dois
  diálogos quase idênticos pra ações que fazem a mesma coisa seria ruído, não clareza. Isso
  também explica por que `Sidebar` já recebia `onRequestImport` como prop desde o incremento
  5 (a mesma prop, só sem UI que a consumisse ainda).
- **`Button asChild` dentro de `DropdownMenuTrigger` quebra em React 18**: o `Button` deste
  projeto (`components/ui/button.tsx`) é uma function component sem `forwardRef`, e o
  padrão `<DropdownMenuTrigger asChild><Button>...</Button></DropdownMenuTrigger>` (comum
  em exemplos do shadcn) dispara `Warning: Function components cannot be given refs` porque
  o Radix Slot não consegue anexar o ref ao `Button`. Descoberto rodando a app de verdade
  num browser headless (Playwright) antes de fechar o incremento — não aparece no
  typecheck/testes, só em runtime. Corrigido nos dois triggers novos aplicando
  `buttonVariants({ variant: "ghost" })` direto na `className` do `DropdownMenuTrigger`, sem
  precisar envolver um `<Button>`. **Não** mexi no `Button` em si nem no padrão
  `asChild`/`Slot` usado em outros lugares do app (ex.: `AiSettingsDialog`,
  `ConfirmDialog`/`DialogOverlay` têm o mesmo tipo de warning, pré-existente, fora do escopo
  deste incremento) — só evitei o padrão problemático no código novo.
- **`dropdown-menu.tsx` gerado pelo shadcn não compilava** sob `exactOptionalPropertyTypes:
  true` (`DropdownMenuCheckboxItem` passava `checked={checked}` com
  `checked: CheckedState | undefined` pro prop `checked` do Radix, que exige exatamente
  `CheckedState` quando presente) — mesma classe de erro já vista em `packages/core`
  (`rules/index.ts`) nos incrementos anteriores. Corrigido com spread condicional
  (`{...(checked !== undefined ? { checked } : {})}`) em vez de atribuição direta.
- **Verificação de ponta a ponta no browser** (Playwright headless, sem skill de "run"
  específica do projeto ainda — candidata a `/run-skill-generator` num incremento futuro):
  confirmado visualmente que trocar idioma depois de importar um arquivo já carregado
  re-roda a análise (diagnósticos, documentação gerada e até o formato de data mudam junto,
  sem precisar reimportar — o efeito construído no incremento 5), que o diagrama de fluxo
  reflete as traduções do incremento 8 (labels de branch "Si es verdadero"/"Si es falso"),
  e que o tema escuro/claro/sistema funciona.

## Arquivos principais

`apps/web/src/components/nav/Sidebar.tsx` (rodapé novo), `apps/web/src/components/nav/Navbar.tsx`
(remove `<ThemeToggle />` duplicado), `apps/web/src/components/nav/ThemeToggle.tsx` (removido,
sem uso), `apps/web/src/components/ui/dropdown-menu.tsx` (novo, com o fix de
`exactOptionalPropertyTypes`), `apps/web/src/lib/i18n/translations/{en,pt,es}.ts`
(namespace `sidebarFooter`).
