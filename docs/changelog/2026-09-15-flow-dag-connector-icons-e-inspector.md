# Ícones de conector, ícones internos e inspector de inputs no viewer de fluxo

## O quê

Três melhorias no `FlowDagView` (viewer de Cloud Flow):

1. **Ícone real por conector** em vez do badge de texto colorido por hash: SharePoint,
   Excel Online, Outlook, Teams, OneDrive, OneNote, Dataverse, Approvals, Planner,
   Microsoft Forms, Power BI, Salesforce, Slack, GitHub, SQL Server, Twitter/X, Dropbox,
   Gmail, Google Sheets e Google Drive têm ícone oficial vendorizado localmente
   (`apps/web/src/assets/connector-icons/*.png` + mapa em `apps/web/src/lib/connector-icons.ts`).
   Conector fora dessa lista cai num ícone de plugue genérico (lucide) — nunca esconde
   que há um conector, só degrada o quão específico o ícone é.
2. **Ícone por tipo de action interna** (If, Switch, Scope, Foreach, Compose,
   InitializeVariable, Terminate, Response, Http, Recurrence etc.) pra blocos sem
   conector — `apps/web/src/lib/flow-action-icons.ts`, com fallback genérico
   (`Workflow`, lucide) pra tipo não mapeado.
3. **Inspector de inputs**: clicar num bloco (não-grupo) abre um painel lateral dentro
   do próprio viewer (`FlowNodeInspector.tsx`) com nome, tipo, conector, `runAfter` e o
   `inputs` bruto do `definition.json`, formatado como JSON.

O collapse de grupos (Foreach/If/Switch/Scope) já existia antes deste incremento —
`flow-layout.ts` trata qualquer node com filhos como grupo colapsável — não precisou de
mudança.

## Por quê

Pedido do usuário: badges de texto pra conector são menos legíveis que o ícone real que
o próprio Power Automate usa; e não dava pra ver o que um bloco recebe sem abrir o
`.json` bruto.

## Decisões

- **`simple-icons` não serve pros conectores mais comuns.** A biblioteca não tem
  nenhuma marca da Microsoft (SharePoint, Excel, Outlook, Teams, OneDrive, Power BI,
  Power Apps, Dynamics 365 — removidas por diretriz de marca) nem Slack/Salesforce.
  Perguntei ao usuário como resolver isso; a resposta foi vendorizar os ícones oficiais
  como assets locais em vez de usar ícones genéricos ou depender de um lookup em
  runtime.
- **Fonte dos ícones vendorizados**: `https://learn.microsoft.com/en-us/connectors/<slug>/`
  referencia o ícone PNG de cada conector num CDN público da Microsoft
  (`static.powerapps.com` ou `conn-afd-prod-endpoint...azurefd.net`, dependendo do
  conector) — o mesmo CDN que o portal do Power Automate usa. Baixados uma vez,
  commitados como asset estático; nenhuma chamada de rede acontece em runtime (spec
  seção 3, client-side only).
- **`connectorName` como chave do mapa**: já sai normalizado do parser
  (`parsers/flow/actions.ts::extractConnectorName`, último segmento do `apiId` sem o
  prefixo `shared_`) e coincide com o slug da página de documentação na maioria dos
  casos testados, então não precisou de tabela de tradução extra.
- **IR estendido com `FlowNode.inputs`** (`z.unknown().optional()`) — só guarda o que já
  vem no `definition.json`, sem normalizar. Seguiu a regra de arquitetura 2 (estender o
  IR em vez de o renderer ler o arquivo bruto).
- **Sem campo `outputs` no IR.** Confirmado com o usuário (ele mesmo corrigiu antes de
  eu perguntar) que só `inputs` importa: a definição estática do Workflow Definition
  Language nunca carrega exemplo de saída — isso só existiria em histórico de execuções,
  que não é um artefato lido por esta ferramenta. O inspector mostra essa ausência
  explicitamente em vez de omitir a seção.
- **Seleção do bloco não usa o sistema de seleção nativo do `@xyflow/react`** — segue o
  mesmo padrão já usado pro collapse (`onToggle` via `data`), agora com `onSelect` +
  `isSelected`, pra manter os dois comportamentos consistentes entre si.

## Arquivos principais

- `packages/core/src/ir/schema.ts` — `FlowNodeSchema.inputs`.
- `packages/core/src/parsers/flow/{actions,parse}.ts` — preserva `inputs` bruto.
- `packages/core/test/parsers/flow.test.ts` — cobertura de `inputs` (trigger, objeto,
  string bare).
- `apps/web/src/lib/connector-icons.ts`, `apps/web/src/lib/flow-action-icons.ts` — mapas
  de ícone.
- `apps/web/src/assets/connector-icons/*.png` — ícones vendorizados.
- `apps/web/src/components/flow/{FlowNode,FlowDagView,FlowNodeInspector}.tsx`.
