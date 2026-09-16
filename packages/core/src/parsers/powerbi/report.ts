import type { Diagnostic, Report, ReportPage, Visual } from "../../ir/index.js";
import type {
  RawReportLayout,
  RawReportSection,
  RawSingleVisual,
  RawVisualContainer,
  RawVisualContainerConfig,
} from "./raw-shapes.js";

/**
 * `singleVisual.objects.title[0].properties.text.expr.Literal.Value` vem
 * como uma string DAX literal entre aspas simples (`"'Título do visual'"`),
 * não o texto puro — confirmado contra `reference/pbi-file-example.pbit`
 * (gitignored), embora nenhum visual do arquivo de exemplo tivesse título
 * setado explicitamente pra confirmar as aspas em texto de verdade; a
 * remoção de aspas simples externas é uma extrapolação da convenção DAX
 * documentada, marcada como tal.
 */
function extractTitle(singleVisual: RawSingleVisual): string | undefined {
  const raw = singleVisual.objects?.title?.[0]?.properties?.text?.expr?.Literal?.Value;
  if (typeof raw !== "string") return undefined;
  const match = /^'(.*)'$/.exec(raw);
  return match ? match[1] : raw;
}

/**
 * `config` é uma string JSON dentro do JSON do container — precisa de um
 * segundo parse. Um container de agrupamento (`singleVisualGroup`, caixa
 * decorativa sem dado por trás) não vira `Visual` — não tem `fields`
 * nenhum pra mostrar, e não é isso que a spec quer dizer com "visual".
 */
function mapVisualContainer(raw: RawVisualContainer): Visual | undefined {
  if (!raw.config) return undefined;

  let config: RawVisualContainerConfig;
  try {
    config = JSON.parse(raw.config) as RawVisualContainerConfig;
  } catch {
    return undefined;
  }

  const singleVisual = config.singleVisual;
  if (!singleVisual) return undefined;

  const fields = (singleVisual.prototypeQuery?.Select ?? [])
    .map((select) => select.Name)
    .filter((name): name is string => typeof name === "string");

  const title = extractTitle(singleVisual);
  return {
    type: singleVisual.visualType ?? "unknown",
    ...(title !== undefined ? { title } : {}),
    fields,
  };
}

function mapSection(raw: RawReportSection, order: number): ReportPage {
  return {
    name: raw.displayName ?? raw.name ?? `Página ${order + 1}`,
    order: raw.ordinal ?? order,
    visuals: (raw.visualContainers ?? [])
      .map(mapVisualContainer)
      .filter((visual): visual is Visual => visual !== undefined),
  };
}

/**
 * Parses a .pbit's Report/Layout (UTF-16LE JSON, ver `readUtf16LEText`) into
 * a `Report` artifact — páginas + visuais com seus campos, pra alimentar a
 * lineage coluna→medida→visual (Fase 16 do plano de novas features).
 * Verificado contra um `.pbit` real (`reference/pbi-file-example.pbit`,
 * gitignored). Retorna `undefined` (não lança) quando o texto não é um JSON
 * válido ou não tem `sections` — degradação honesta, o `DataModel` já
 * parseado continua valendo mesmo sem o `Report`.
 */
export function parseReportLayout(text: string, id: string, diagnostics: Diagnostic[]): Report | undefined {
  let layout: RawReportLayout;
  try {
    layout = JSON.parse(text) as RawReportLayout;
  } catch (err) {
    diagnostics.push({
      code: "PL506",
      severity: "warning",
      message: `"Report/Layout" não é um JSON válido: ${String(err)}`,
    });
    return undefined;
  }

  if (!Array.isArray(layout.sections) || layout.sections.length === 0) {
    diagnostics.push({
      code: "PL507",
      severity: "info",
      message: 'Não encontrei "sections" em "Report/Layout"; relatório tratado como sem páginas.',
    });
    return undefined;
  }

  const pages = layout.sections
    .map((section, index) => mapSection(section, index))
    .sort((a, b) => a.order - b.order);

  return { kind: "report", id, name: "Relatório", pages };
}
