import { zipSync } from "fflate";
import type { PowerLensDocument } from "../ir/index.js";
import { renderMarkdown } from "./markdown/index.js";

const encoder = new TextEncoder();

function buildPromptMd(document: PowerLensDocument): string {
  return `# Instruções para o LLM

Você recebeu um pacote de contexto gerado pelo Power Lens sobre o arquivo
"${document.source.fileName}" (${document.source.detectedFormat}).

O arquivo \`ir.json\` neste pacote é uma representação estrutural completa e
determinística do artefato — telas, controles, fórmulas, fontes de dados,
fluxos, tabelas, conforme o caso. \`summary.md\` é a mesma informação já
formatada como documentação legível.

Use **apenas** o conteúdo de \`ir.json\`/\`summary.md\` como fonte de verdade
sobre a estrutura do artefato. Não invente controles, telas, fontes de dados
ou fórmulas que não apareçam nesses arquivos.

Tarefas sugeridas (adapte à sua necessidade):

1. Escreva um resumo em linguagem natural do que este artefato faz.
2. Liste riscos ou pontos de atenção que você observar na estrutura (nomes
   genéricos de controle, fórmulas repetidas, dependências externas).
3. Sugira um plano de teste manual cobrindo os principais fluxos de tela.

Diagnósticos em \`ir.json\` (campo \`diagnostics\`) apontam problemas que o
Power Lens já detectou estruturalmente — não repita esses achados como se
fossem seus, mas pode expandir sobre eles.
`;
}

function buildReadme(document: PowerLensDocument): string {
  return `Power Lens — pacote de contexto
================================

Arquivo original: ${document.source.fileName}
Formato: ${document.source.detectedFormat}
Gerado em: ${document.source.parsedAt}

Conteúdo deste pacote:

- ir.json      -> representação estrutural completa do artefato (a IR do Power Lens)
- summary.md   -> a mesma informação, já formatada como documentação Markdown
- PROMPT.md    -> instruções prontas para colar em um LLM (ChatGPT, Copilot, etc.)

Como usar: abra uma conversa com o LLM de sua preferência, cole o conteúdo de
PROMPT.md, e em seguida cole o conteúdo de ir.json (ou anexe o arquivo, se o
LLM aceitar anexos). Nenhum arquivo original da Power Platform está neste
pacote — apenas a estrutura extraída pelo Power Lens.
`;
}

/**
 * Builds the downloadable context pack (spec section 9): ir.json + the same
 * deterministic Markdown doc export + a ready-to-paste prompt + a plain-text
 * README. Deliberately does not prune the IR for very large artifacts yet
 * (spec mentions a future `toPromptPayload(doc, { maxDepth, includeExpressions })`)
 * — out of scope for Fase 1.
 */
export function buildContextPack(document: PowerLensDocument): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "power-lens-pack/ir.json": encoder.encode(JSON.stringify(document, null, 2)),
    "power-lens-pack/summary.md": encoder.encode(renderMarkdown(document)),
    "power-lens-pack/PROMPT.md": encoder.encode(buildPromptMd(document)),
    "power-lens-pack/README.txt": encoder.encode(buildReadme(document)),
  };
  return zipSync(files);
}
