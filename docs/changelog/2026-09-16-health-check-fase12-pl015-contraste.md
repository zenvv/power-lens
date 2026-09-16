# Fase 12 do plano de novas features: PL015 (contraste texto/fundo)

## O quê

`packages/core/src/rules/pl015-low-contrast.ts`: nova regra de health check
que sinaliza contraste entre `Color` (texto) e `Fill` (fundo) abaixo do
mínimo recomendado pela WCAG AA (4.5:1) num controle com texto literal.
Reaproveita `resolveScreenLayout` do renderer de wireframe (Fase 5) pra
resolver `Fill`/`Color` quando são literais ou `RGBA(...)` com argumentos
constantes — a mesma resolução que o wireframe já faz, aplicada aqui como
diagnóstico em vez de desenho.

Diferente das outras features do plano (`docs/changelog/2026-09-16-*fase*`),
esta é uma feature **completa** nesta fase: por ser um `Diagnostic`, aparece
sozinha no `DiagnosticsPanel` já existente assim que a regra roda — não
precisa de nenhum componente de UI novo em `apps/web`.

## Por quê

Fase 12 do plano de 13 features. Diferente de PL007 (label de acessibilidade
ausente), contraste de cor nunca tinha checagem nenhuma no projeto.

## Decisões

- **Só avalia quando os dois canais alpha são totalmente opacos (`a === 1`).**
  Compor a cor real de um fundo semi-transparente exigiria saber o que está
  atrás dele (outro controle, a cor de fundo da tela) — informação que a
  extração rasa deste projeto não tem. Preferiu não avaliar a arriscar um
  número errado.
- **Limiar único de 4.5:1** (texto normal), sem diferenciar texto grande
  (WCAG permite 3:1 pra texto ≥18px/14px bold) — a regra não tem garantia de
  que `fontSize` também resolveu pra um número, então diferenciar o limiar
  seria supor um tamanho não confirmado. Documentado explicitamente no hint
  do diagnóstico, não escondido.
- **Reaproveita `resolveScreenLayout`/`ResolvedControl` do wireframe** em vez
  de duplicar a lógica de resolução de `RGBA(...)` — mesmo espírito de reuso
  já usado por PL009 (lista de conectores premium) e agora por PL011.
  `rules/` importar de `render/wireframe/` não fere a regra de arquitetura 1
  do `CLAUDE.md` (é sobre não ler arquivo bruto fora de `parsers/`, os dois
  módulos operam só sobre o IR já parseado).

## Arquivos principais

- `packages/core/src/rules/pl015-low-contrast.ts`
- `packages/core/src/rules/index.ts`
- `packages/core/test/rules/pl015-low-contrast.test.ts`, `index.test.ts`
