import type { DataModel, Report } from "../ir/index.js";

export type LineageVisualRef = {
  pageName: string;
  visualType: string;
  visualTitle?: string;
};

export type LineageEntry = {
  table: string;
  name: string;
  kind: "column" | "measure";
  /** Todo visual encontrado que referencia essa coluna/medida — vazio
   * significa "não usada em nenhum visual deste relatório" (reforça PL013:
   * um `dataModel` sem `report` associado sempre devolve tudo com
   * `visuals: []`, não é sinal de "não usada", só de "sem como saber"). */
  visuals: LineageVisualRef[];
};

/**
 * `prototypeQuery.Select[].Name` de um visual referencia campo como
 * "Tabela.Nome" (coluna ou medida — a mesma convenção sintática pros dois,
 * `Report/Layout` não distingue), às vezes envolvido numa função de
 * agregação: "Min(Tabela.Nome)". Confirmado contra
 * `reference/pbi-file-example.pbit` pros dois casos: um cartão do relatório
 * real referenciava 3 medidas (`GANTT.ANDAMENTO`, `GANTT.AGUARDANDO`,
 * `GANTT.PARADO`) exatamente nesse formato "Tabela.NomeDaMedida".
 */
function parseFieldRef(field: string): { table: string; name: string } | undefined {
  const aggregationMatch = /^[A-Za-z_][A-Za-z0-9_]*\(([^()]+)\)$/.exec(field);
  const inner = aggregationMatch ? aggregationMatch[1]! : field;

  const dotIndex = inner.indexOf(".");
  if (dotIndex <= 0 || dotIndex === inner.length - 1) return undefined;
  return { table: inner.slice(0, dotIndex), name: inner.slice(dotIndex + 1) };
}

function key(table: string, name: string): string {
  return `${table.toLowerCase()}.${name.toLowerCase()}`;
}

/**
 * Cruza `DataModel` (tabelas/colunas/medidas) com `Report` (páginas/visuais)
 * do mesmo documento: pra cada coluna e medida, lista em quais visuais ela
 * aparece. Sem `report` (nenhum `.pbit`/`Report/Layout` associado — feature
 * ainda não existe pra Dataverse), toda entrada volta com `visuals: []`.
 */
export function buildLineageIndex(dataModel: DataModel, report: Report | undefined): LineageEntry[] {
  const entries = new Map<string, LineageEntry>();

  for (const table of dataModel.tables) {
    for (const column of table.columns) {
      entries.set(key(table.name, column.name), { table: table.name, name: column.name, kind: "column", visuals: [] });
    }
  }
  for (const measure of dataModel.measures) {
    entries.set(key(measure.table, measure.name), { table: measure.table, name: measure.name, kind: "measure", visuals: [] });
  }

  if (!report) return [...entries.values()];

  for (const page of report.pages) {
    for (const visual of page.visuals) {
      for (const field of visual.fields) {
        const ref = parseFieldRef(field);
        if (!ref) continue;

        const entry = entries.get(key(ref.table, ref.name));
        if (!entry) continue;

        entry.visuals.push({
          pageName: page.name,
          visualType: visual.type,
          ...(visual.title !== undefined ? { visualTitle: visual.title } : {}),
        });
      }
    }
  }

  return [...entries.values()];
}
