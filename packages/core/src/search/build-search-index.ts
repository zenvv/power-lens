import type { PowerLensDocument, Reference } from "../ir/index.js";
import { forEachControl, forEachExpression } from "../rules/walk-canvas-app.js";

/**
 * Todo tipo de entidade nomeada que a busca global consegue indexar — os
 * seis `Reference["kind"]` já extraídos de fórmulas (declaração OU uso,
 * dependendo de onde a entrada veio) mais entidades que não têm um
 * `Reference` associado (ação de fluxo, tabela, medida...).
 */
export type SearchEntryKind = Reference["kind"] | "flowTrigger" | "flowAction" | "connection" | "table" | "column" | "measure" | "component";

export type SearchEntry = {
  kind: SearchEntryKind;
  name: string;
  artifactId: string;
  artifactName: string;
  /** Caminho legível até onde a entrada foi encontrada (spec: `Diagnostic.path`
   * usa a mesma convenção) — "Screen1/Label3.Text", "Sales.CustomerId". */
  path: string;
};

/**
 * Indexa toda entidade nomeada de um documento pra busca global ("find
 * usages"): controles, fontes de dados, variáveis/coleções e telas de um
 * Canvas App (declaração + toda referência encontrada em fórmula), ação/
 * gatilho/conexão de um Cloud Flow, tabela/coluna/medida de um modelo de
 * dados. Não faz busca textual dentro do `inputs` bruto de uma ação de fluxo
 * (isso é `unknown`, sem estrutura de referência) — escopo de v1,
 * deliberadamente mais simples que um grep no JSON inteiro.
 */
export function buildSearchIndex(doc: PowerLensDocument): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const artifact of doc.artifacts) {
    if (artifact.kind === "canvasApp") {
      for (const screen of artifact.screens) {
        entries.push({ kind: "screen", name: screen.name, artifactId: artifact.id, artifactName: artifact.name, path: screen.name });
      }
      for (const component of artifact.components) {
        entries.push({
          kind: "component",
          name: component.name,
          artifactId: artifact.id,
          artifactName: artifact.name,
          path: component.name,
        });
      }
      for (const dataSource of artifact.dataSources) {
        entries.push({
          kind: "dataSource",
          name: dataSource.name,
          artifactId: artifact.id,
          artifactName: artifact.name,
          path: dataSource.name,
        });
      }

      forEachControl(artifact, (control, path) => {
        entries.push({ kind: "control", name: control.name, artifactId: artifact.id, artifactName: artifact.name, path });
      });

      forEachExpression(artifact, (expression, propertyName, _control, path) => {
        for (const ref of expression.references) {
          entries.push({
            kind: ref.kind,
            name: ref.name,
            artifactId: artifact.id,
            artifactName: artifact.name,
            path: `${path}.${propertyName}`,
          });
        }
      });

      for (const ref of artifact.onStart?.references ?? []) {
        entries.push({ kind: ref.kind, name: ref.name, artifactId: artifact.id, artifactName: artifact.name, path: "App.OnStart" });
      }
    }

    if (artifact.kind === "cloudFlow") {
      entries.push({
        kind: "flowTrigger",
        name: artifact.trigger.name,
        artifactId: artifact.id,
        artifactName: artifact.name,
        path: artifact.trigger.name,
      });
      for (const node of artifact.actions) {
        entries.push({ kind: "flowAction", name: node.name, artifactId: artifact.id, artifactName: artifact.name, path: node.name });
      }
      for (const connection of artifact.connections) {
        entries.push({
          kind: "connection",
          name: connection.name,
          artifactId: artifact.id,
          artifactName: artifact.name,
          path: connection.name,
        });
      }
    }

    if (artifact.kind === "dataModel") {
      for (const table of artifact.tables) {
        entries.push({ kind: "table", name: table.name, artifactId: artifact.id, artifactName: artifact.name, path: table.name });
        for (const column of table.columns) {
          entries.push({
            kind: "column",
            name: column.name,
            artifactId: artifact.id,
            artifactName: artifact.name,
            path: `${table.name}.${column.name}`,
          });
        }
      }
      for (const measure of artifact.measures) {
        entries.push({
          kind: "measure",
          name: measure.name,
          artifactId: artifact.id,
          artifactName: artifact.name,
          path: `${measure.table}.${measure.name}`,
        });
      }
    }
  }

  return entries;
}

/** Busca por substring, sem diferenciar maiúscula/minúscula — suficiente pro
 * caso de uso ("achar onde X aparece"), sem exigir digitar o nome exato. */
export function searchIndex(entries: readonly SearchEntry[], query: string): SearchEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return entries.filter((entry) => entry.name.toLowerCase().includes(needle));
}
