# Processo de CI/CD e changelog

## O quê

- Nova seção "CI/CD e changelog" no `CLAUDE.md` com as regras de trabalho: changelog por
  incremento, commit+push automático e frequente pra `main`, gate local de
  typecheck+teste antes de commitar, e CI remoto como rede de segurança.
- Pasta `docs/changelog/` com `README.md` explicando o formato das entradas.
- Pipeline de CI em `.github/workflows/ci.yml`: typecheck, test e build em push pra
  `main` e em qualquer PR.

## Por quê

O usuário pediu uma disciplina de "CI/CD constante": cada feature documentada, sync
frequente com o remoto, e uma base pra eventualmente escrever um blueprint/resumo final
do projeto sem precisar minerar `git log`.

## Decisões

- Changelog: 1 arquivo por feature/incremento (não por dia), nomeado
  `AAAA-MM-DD-slug.md` — mais fácil de linkar de commits e combina melhor com a regra
  já existente de "incrementos pequenos".
- Idioma do changelog: português, pra ficar consistente com `docs/SPEC.md` e
  `docs/FORMAT-NOTES.md` (as mensagens de commit continuam em inglês, sem mudança aí).
- Push: automático e direto pra `main` a cada incremento coerente, sem pedir
  confirmação a cada vez — projeto é solo, então não há necessidade de branch/PR por
  feature.
- CI real (GitHub Actions) desde já, não só disciplina manual — pega regressões que o
  gate local eventualmente deixar passar.

## Arquivos principais

- `CLAUDE.md`
- `docs/changelog/README.md`
- `.github/workflows/ci.yml`
