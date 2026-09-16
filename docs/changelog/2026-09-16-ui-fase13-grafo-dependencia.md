# Fase 13 (UI) do plano de novas features: grafo de dependência

## O quê

- Nova `SectionId: "dependencies"` (`Sidebar.tsx`), visível só quando
  `document.dependencies.length > 0` (mesmo padrão condicional de
  `diagnostics`).
- `npx shadcn@latest add tooltip`. `apps/web/src/lib/dependency-graph-layout.ts`
  (elkjs "layered", mesmo molde de `mer-layout.ts`/`flow-layout.ts`): um nó
  por artefato referenciado em alguma `DependencyEdge` (não todo artefato do
  documento — só quem tem vínculo), rótulo curto via `shortArtifactName`
  (já usado pelo resto do app pra tirar prefixo de path/GUID de fluxo).
- `apps/web/src/components/graph/{DependencyNode,DependencyGraphView}.tsx`
  (novos): aresta tracejada + rótulo "(heuristic)"/"(heurística)" quando
  `confidence !== "exact"` (mesma convenção visual já usada pelo MER pra
  relacionamento inativo); hover num nó mostra tipo do artefato + nome
  completo (tooltip, `TooltipProvider` local ao componente).

Fecha a Fase 13 da camada de UI (núcleo pronto desde
`2026-09-16-dependencias-fase13-grafo-solution.md`).

## Por quê

Sexta peça da sequência de UI, penúltima do plano — só falta a Fase 14
(diff).

## Decisões

- **Ajuste de escopo em relação ao plano original**: hover na *aresta*
  (mostrar a confiança do vínculo) virou rótulo sempre visível na aresta
  (`"flow (heuristic)"`) em vez de tooltip — um tipo de aresta customizado
  só pra isso não compensava o esforço, e o texto sempre visível é mais
  fácil de notar do que um hover escondido. O hover no *nó* (tipo + nome
  completo) foi mantido como planejado, mais simples de implementar num
  node customizado.
- **`shortArtifactName` reaproveitado** pro rótulo do nó — sem isso, um
  fluxo dentro de uma solution aparecia com o path completo
  (`"Workflows/ParentFlow"`) em vez de só `"ParentFlow"`, inconsistente com
  o resto do app (`ArtifactTabs` já faz isso).
- **Verificado ao vivo** com uma solution sintética zipada na hora (dois
  `Workflows/*.json`, um chamando o outro via ação `type: "Workflow"`): a
  aresta apareceu tracejada com rótulo "flow (heuristic)" — confidence saiu
  heurística porque o id interno do fluxo (`"Workflows/ChildFlow"`, com
  prefixo de path) não bate exatamente com o segmento final da URL
  referenciada (`"ChildFlow"`), só por substring — comportamento esperado
  do matching por nome, não um bug.

## Arquivos principais

- `apps/web/src/lib/dependency-graph-layout.ts` (novo)
- `apps/web/src/components/graph/{DependencyNode,DependencyGraphView}.tsx` (novos)
- `apps/web/src/components/ui/tooltip.tsx` (shadcn, novo)
- `apps/web/src/components/nav/Sidebar.tsx`, `apps/web/src/components/DocumentView.tsx`
- `apps/web/src/lib/i18n/translations/{en,pt,es}.ts` (`nav.dependencies`,
  namespace `dependencies`)
