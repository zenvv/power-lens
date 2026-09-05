# Prompt de kickoff — Claude Code

> Preparação antes de rodar: repo novo e vazio, `docs/SPEC.md` já commitado, e os arquivos de referência do CMPA copiados para `reference/cmpa/` (essa pasta entra no `.gitignore`).

---

## Prompt 1 — Reconhecimento (rodar sozinho, sem escrever código de produção)

```
Contexto: vou construir o Power Lens, uma ferramenta client-side de análise e
documentação de arquivos da Power Platform. A spec completa está em docs/SPEC.md.
Leia ela inteira antes de qualquer outra coisa.

Em reference/cmpa/ estão os arquivos de um projeto anterior meu (CMPA) que já
extrai informação de arquivos .msapp e gera documentação.

REGRAS SOBRE reference/cmpa/:
- É material de LEITURA APENAS. Não copie a arquitetura dele, não porte a
  estrutura de pastas, não reaproveite as abstrações. O Power Lens tem uma
  arquitetura diferente (IR no meio), definida na spec.
- O valor dele para você é CONHECIMENTO EMPÍRICO SOBRE O FORMATO: quais chaves
  aparecem no YAML, como os controles são aninhados, quais campos são opcionais,
  quais casos de borda ele já teve que tratar, o que ele descobriu na marra.
- Trechos de lógica de extração pontuais podem ser aproveitados, mas só depois
  que a estrutura nova estiver definida, e adaptados ao IR.

Nesta primeira tarefa NÃO escreva código de produção. Entregue apenas
docs/FORMAT-NOTES.md, documentando o que você aprendeu sobre os formatos a
partir do CMPA e da spec:

1. Estrutura interna de um .msapp no formato novo (o que existe dentro do zip,
   o que cada arquivo contém, o shape do Src/*.pa.yaml).
2. Estrutura interna de uma solution .zip.
3. Casos de borda e armadilhas que o código do CMPA revela ter enfrentado.
4. Lacunas: o que você NÃO conseguiu determinar e vai precisar de um arquivo
   real para descobrir. Liste como perguntas concretas.

Seja explícito sobre o que é fato observado no código do CMPA versus o que é
suposição sua. Marque as suposições.
```

**Pare aqui e leia o FORMAT-NOTES.md.** É onde você descobre se o Claude Code entendeu o domínio ou está alucinando estrutura de arquivo. Corrija antes de deixar ele escrever qualquer linha.

---

## Prompt 2 — Scaffolding

```
Monte o esqueleto do monorepo conforme a seção 12 da spec.

Escopo desta tarefa, e nada além dela:
- pnpm workspaces com packages/core e apps/web
- TypeScript strict em ambos
- Vitest configurado no core
- Vite + React no apps/web, com uma tela única de dropzone que ainda não faz nada
- .gitignore incluindo reference/ e fixtures/real/
- CLAUDE.md na raiz com: os princípios da seção 3 da spec, a regra dura de
  arquitetura ("nenhum renderer abre zip"), e o padrão de commits

NÃO implemente parser nenhum ainda. NÃO crie arquivos de placeholder para
módulos futuros. Quero um esqueleto que compila e roda vazio.
```

---

## Prompt 3 — O IR primeiro

```
Implemente packages/core/src/ir/ conforme a seção 5 da spec.

- Schema em zod como fonte de verdade; tipos TypeScript derivados via z.infer.
- schemaVersion literal "0.1", com uma nota no código sobre a política de
  versionamento.
- Uma função createEmptyDocument(source) e um validador exportado.
- Testes cobrindo: documento mínimo válido, documento inválido rejeitado com
  mensagem útil, e round-trip JSON.parse(JSON.stringify(doc)).

Nada de parser ainda. O IR precisa estar estável antes de qualquer coisa
escrever nele.
```

---

## Prompt 4 — Primeiro parser, guiado por fixture

```
Implemente o parser de .msapp no formato novo (Src/*.pa.yaml), em
packages/core/src/parsers/msapp/.

Método: test-first. Em fixtures/synthetic/ há um .msapp pequeno que eu montei.
Escreva primeiro o teste que afirma qual IR ele deve produzir, depois o parser.

Requisitos:
- Usa fflate para o zip e yaml para o parse.
- Emite PowerLensDocument válido pelo schema zod.
- Erro de parsing vira Diagnostic no documento, não exception. A ferramenta
  nunca deve engasgar inteira por causa de uma tela malformada.
- Expression.references é extraído por análise RASA (tokenização/regex sobre a
  string da fórmula). Não escreva um parser de gramática Power Fx. Se um
  identificador for ambíguo, prefira não classificar a classificar errado.

Trabalhe em incrementos: primeiro só nomes de tela, depois árvore de controles,
depois propriedades, depois references. Rode os testes a cada incremento.
```

---

## Regras permanentes para o CLAUDE.md do repo

Cole isso no `CLAUDE.md` que o Prompt 2 cria:

```markdown
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
  supor. Suposição errada sobre estrutura de .msapp custa mais caro do que uma
  pergunta.
```
