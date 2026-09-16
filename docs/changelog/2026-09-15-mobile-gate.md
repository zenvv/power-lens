# Tela de bloqueio pra mobile + nota "desktop only" no CLAUDE.md

## O quê

- `CLAUDE.md`: nova seção "Desktop only" deixando explícito que o app não precisa de
  adaptação de layout/interação pra mobile — só uma tela informativa quando acessado de
  uma tela pequena.
- `apps/web/src/components/MobileGate.tsx`: componente novo, mensagem simples ("Power
  Lens" + ícone de monitor + "Disponível apenas para desktop") pra quando o app é aberto
  numa tela estreita.
- `apps/web/src/App.tsx`: o app inteiro (navbar, sidebar, viewer) passa a renderizar só
  a partir do breakpoint `md` (`hidden md:flex`); abaixo disso mostra só o `MobileGate`.
  O restante da árvore continua montado (mas oculto via CSS), então não precisou de
  detecção de viewport em JS nem hook de resize.

## Por quê

Pedido direto do usuário: o app é uma ferramenta de leitura/navegação de IR (árvores de
tela, DAG de fluxo, etc.) que não faz sentido tentar encaixar em mobile — em vez de gastar
esforço adaptando cada view, é melhor deixar explícito no CLAUDE.md que isso está fora de
escopo e ter uma tela dedicada avisando o usuário.

## Decisões

- **Gate por CSS (`md:hidden` / `hidden md:flex`), não JS/`matchMedia`**: mais simples,
  sem flash de conteúdo errado no primeiro render nem listener de resize. O app continua
  montado em DOM mas oculto abaixo de `md` — como a tela inicial é sempre a de import
  (nada roda sozinho), não há custo de processamento escondido.
- **Breakpoint `md` (768px)**, o mesmo já usado pro toggle de sidebar mobile
  (`Navbar.tsx`), pra manter consistência com o resto do app em vez de introduzir um
  segundo limiar.

## Arquivos principais

- `CLAUDE.md`
- `apps/web/src/components/MobileGate.tsx`
- `apps/web/src/App.tsx`
