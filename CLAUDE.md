# Power Lens

Ferramenta open source, 100% client-side, para ler, entender e documentar artefatos da
Power Platform (`.msapp`, solution `.zip`, definição de fluxo, `.pbit`/`.pbip`/`.pbix`).
Spec completa em `docs/SPEC.md`. Conhecimento empírico sobre os formatos em
`docs/FORMAT-NOTES.md`.

## Princípios (spec seção 3)

| Princípio | Consequência prática |
|---|---|
| **Client-side only** | Todo parsing acontece no browser. Nenhum arquivo sai da máquina. Deploy é estático. |
| **IR-first** | Nenhum renderer lê arquivo bruto. Tudo consome o IR. |
| **Determinístico por padrão** | Toda a extração e a documentação base funcionam sem IA. IA é camada opcional em cima. |
| **Degradação honesta** | Quando não dá para extrair algo, a UI diz o que falta e por quê, em vez de mostrar vazio. |
| **Offline-capable** | Depois de carregada, a app funciona sem rede (exceto a chamada opcional de LLM). |

## Regras de arquitetura

1. Nenhum código fora de `packages/core/src/parsers/` abre zip, lê YAML ou
   conhece a estrutura de um arquivo da Power Platform. Renderers consomem
   apenas o IR.
2. Se um renderer precisa de um dado que não está no IR, a resposta é estender
   o IR, nunca fazer o renderer ler o arquivo.
3. Falha de parsing vira `Diagnostic`, não exception.
4. Nenhuma dependência que precise de servidor, build step de servidor ou
   variável de ambiente em runtime.
5. Nenhum arquivo de `fixtures/real/` é commitado, em nenhuma hipótese.
6. Toda regra de health check é uma função pura
   `(doc: PowerLensDocument) => Diagnostic[]` em seu próprio arquivo.

## Como trabalhar aqui

- Incrementos pequenos. Um parser por vez, uma regra por vez.
- Teste antes de implementação em tudo que toca parsing.
- Não crie arquivos de placeholder para features futuras.
- Quando estiver em dúvida sobre o formato de um arquivo, pergunte em vez de
  supor. Suposição errada sobre estrutura de `.msapp` custa mais caro do que uma
  pergunta.

## `reference/`

`reference/CMPA/` é material de projeto anterior, **leitura apenas**. Não portar
arquitetura, estrutura de pastas ou abstrações de lá — só conhecimento empírico sobre o
formato (já extraído em `docs/FORMAT-NOTES.md`). Está no `.gitignore`.

## Stack

- Monorepo pnpm workspaces: `packages/core` (parsers + IR + regras, zero DOM, roda em
  Node e no browser), `apps/web` (viewer, Vite + React + TypeScript).
- Zip: `fflate`. YAML: `yaml` (eemeli). Validação do IR: `zod`, com schema como fonte de
  verdade e tipos TS derivados via `z.infer`. Testes: Vitest.
- UI: Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first config em `src/index.css`, sem
  `tailwind.config.js`) + shadcn/ui (`apps/web/components.json`, preset "Nova", tema
  neutral com CSS variables e dark mode via classe `.dark` na tag `<html>`). Componentes
  gerados ficam em `apps/web/src/components/ui/`; usar `npx shadcn@latest add <componente>`
  de dentro de `apps/web/` para adicionar novos, em vez de escrever do zero à mão.

## Padrão de commits

Mensagens curtas, no imperativo, descrevendo o quê e por quê — não narrar o processo.
Um commit por incremento coerente (ex.: "Add IR schema for CanvasApp", não "WIP").

## CI/CD e changelog

1. **Changelog por incremento.** Toda feature nova ou alterada gera um arquivo em
   `docs/changelog/AAAA-MM-DD-slug.md` (ver `docs/changelog/README.md` pro formato).
   Escrito em português, como o resto da documentação. Cobre o quê, por quê, decisões
   tomadas (inclusive respostas a perguntas feitas durante o incremento) e arquivos
   principais tocados.
2. **Sync frequente.** Cada incremento coerente = commit + push imediato pra `main`,
   sem pedir confirmação a cada vez. A ideia é sincronizar com o remoto com frequência,
   não acumular trabalho local.
3. **Gate local antes de commitar.** Rodar `pnpm typecheck` e `pnpm test` (na raiz)
   antes de cada commit que toque código. Isso estende a regra "teste antes de
   implementação" pra também cobrir "não commitar com teste ou typecheck quebrado".
4. **CI remoto como rede de segurança.** `.github/workflows/ci.yml` roda typecheck,
   testes e build em push pra `main` e em qualquer PR. Ele existe pra pegar o que o
   gate local eventualmente deixar passar — não substitui rodar localmente antes.
5. **Changelog alimenta o blueprint final.** O acúmulo de `docs/changelog/*.md` é a
   fonte primária pra eventualmente escrever um resumo/blueprint consolidado do
   projeto. Não precisa existir esse resumo agora — só manter o changelog completo o
   suficiente pra ele poder ser escrito depois sem precisar minerar `git log`.
