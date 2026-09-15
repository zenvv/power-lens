# Changelog

Histórico de features e alterações do projeto, um arquivo por incremento coerente.
Serve de matéria-prima pra um blueprint/resumo final do projeto (ver seção "CI/CD e
changelog" no `CLAUDE.md`), sem precisar minerar `git log` pra reconstruir o porquê das
decisões.

## Nome do arquivo

```
AAAA-MM-DD-slug-curto.md
```

- Data do dia em que o incremento foi feito.
- Slug curto e descritivo do que foi feito (ex.: `flow-dag-renderer`, `ir-schema-canvasapp`).

## Conteúdo esperado

Cada arquivo deve responder, em português, de forma breve:

- **O quê**: o que foi adicionado/alterado/removido.
- **Por quê**: motivação — bug, gap de spec, pedido do usuário, etc.
- **Decisões**: escolhas não óbvias tomadas durante o incremento, inclusive respostas a
  perguntas feitas ao usuário quando havia dúvida sobre formato/arquitetura.
- **Arquivos principais**: paths dos arquivos mais relevantes tocados (não precisa ser
  exaustivo — `git show` resolve o resto).

Não é um relatório de processo passo a passo — é o contexto que uma pessoa (ou uma IA)
sem memória da conversa precisaria pra entender por que o código está como está.
