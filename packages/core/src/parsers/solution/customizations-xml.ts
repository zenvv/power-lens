import { XMLParser } from "fast-xml-parser";
import type { DataModel, Diagnostic, ModelColumn, ModelTable, Relationship } from "../../ir/index.js";
import type {
  RawAttribute,
  RawCustomizationsXml,
  RawEntity,
  RawEntityRelationship,
} from "./raw-shapes.js";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function mapColumn(raw: RawAttribute): ModelColumn | undefined {
  const name = raw["@_PhysicalName"];
  if (!name) return undefined;

  return {
    name,
    dataType: raw.Type ?? "unknown",
    // Presença de CalculationOf/FormulaDefinitionFileName é o sinal direto
    // de coluna calculada — mais seguro que decodificar o inteiro opaco de
    // SourceType, cujo significado exato o XSD não documenta.
    isCalculated: Boolean(raw.CalculationOf || raw.FormulaDefinitionFileName),
  };
}

function mapEntity(raw: RawEntity): ModelTable | undefined {
  const name = raw["@_Name"];
  if (!name) return undefined;

  const rawAttributes = normalizeArray(raw.EntityInfo?.entity?.attributes?.attribute);
  const columns = rawAttributes.map(mapColumn).filter((c): c is ModelColumn => c !== undefined);

  return { name, columns };
}

/**
 * Toda tabela Dataverse tem coluna de chave primária com nome previsível —
 * `<nome lógico da entidade>id` — regra fixa da plataforma, não suposição
 * sobre este arquivo específico (não há como saber o nome da PK da entidade
 * referenciada só pelos campos do próprio `EntityRelationship`).
 */
function primaryKeyOf(entityName: string): string {
  return `${entityName}id`;
}

function mapRelationship(raw: RawEntityRelationship, diagnostics: Diagnostic[]): Relationship | undefined {
  if (raw.EntityRelationshipType === "ManyToMany") {
    if (!raw.FirstEntityName || !raw.SecondEntityName) return undefined;
    return {
      from: { table: raw.FirstEntityName, column: primaryKeyOf(raw.FirstEntityName) },
      to: { table: raw.SecondEntityName, column: primaryKeyOf(raw.SecondEntityName) },
      cardinality: "manyToMany",
      // Dataverse não tem o conceito de cross-filter de DAX/Power BI — não
      // há campo equivalente neste schema; "single" é só o valor exigido
      // pelo tipo do IR, sem sinal real por trás pra este formato.
      crossFilter: "single",
      isActive: true,
    };
  }

  if (raw.EntityRelationshipType === "OneToMany") {
    if (!raw.ReferencingEntityName || !raw.ReferencedEntityName) return undefined;
    return {
      from: { table: raw.ReferencingEntityName, column: raw.ReferencingAttributeName ?? "unknown" },
      to: { table: raw.ReferencedEntityName, column: primaryKeyOf(raw.ReferencedEntityName) },
      cardinality: "manyToOne",
      crossFilter: "single",
      isActive: true,
    };
  }

  diagnostics.push({
    code: "PL309",
    severity: "info",
    message: `Relacionamento "${raw["@_Name"] ?? "(sem nome)"}" com EntityRelationshipType "${raw.EntityRelationshipType ?? "(ausente)"}" não reconhecido; ignorado.`,
  });
  return undefined;
}

/**
 * Parses customizations.xml (Dataverse tables) into a DataModel artifact —
 * reusa o mesmo shape do modelo de dados do Power BI (tabelas/colunas/
 * relacionamentos), já que ambos são "tabelas com colunas tipadas e
 * relacionamentos entre si". Schema verificado contra o
 * CustomizationsSolution.xsd oficial da Microsoft (docs/FORMAT-NOTES.md
 * seção 2.1) — ainda não validado contra uma solution real exportada.
 */
export function parseCustomizationsXml(
  text: string,
  id: string,
  diagnostics: Diagnostic[],
): DataModel | undefined {
  let parsed: RawCustomizationsXml;
  try {
    parsed = parser.parse(text) as RawCustomizationsXml;
  } catch (err) {
    diagnostics.push({
      code: "PL308",
      severity: "error",
      message: `customizations.xml não é um XML válido: ${String(err)}`,
      path: "customizations.xml",
    });
    return undefined;
  }

  const rawEntities = normalizeArray(parsed.ImportExportXml?.Entities?.Entity);
  const tables = rawEntities.map(mapEntity).filter((t): t is ModelTable => t !== undefined);

  if (tables.length === 0) return undefined;

  const rawRelationships = normalizeArray(parsed.ImportExportXml?.EntityRelationships?.EntityRelationship);
  const relationships = rawRelationships
    .map((rel) => mapRelationship(rel, diagnostics))
    .filter((r): r is Relationship => r !== undefined);

  return {
    kind: "dataModel",
    id,
    name: "Tabelas Dataverse",
    tables,
    relationships,
    measures: [],
  };
}
