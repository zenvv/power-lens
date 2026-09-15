import {
  createEmptyDocument,
  type CanvasApp,
  type Control,
  type DataModel,
  type Expression,
  type PowerLensDocument,
  type Reference,
} from "../../src/ir/index.js";

export function emptyDocument(): PowerLensDocument {
  return createEmptyDocument({ fileName: "Test.msapp", fileSize: 0, detectedFormat: "msapp" });
}

export function control(overrides: Partial<Control> & Pick<Control, "name" | "type">): Control {
  return { properties: {}, children: [], ...overrides };
}

export function literal(value: string): Expression {
  return { raw: value, kind: "literal", literal: value, references: [] };
}

export function formula(raw: string, references: Reference[] = []): Expression {
  return { raw, kind: "formula", references };
}

export function ref(kind: Reference["kind"], name: string): Reference {
  return { kind, name };
}

export function canvasApp(overrides: Partial<CanvasApp> = {}): CanvasApp {
  return {
    kind: "canvasApp",
    id: "app-1",
    name: "App",
    screens: [],
    components: [],
    dataSources: [],
    variables: [],
    ...overrides,
  };
}

export function dataModel(overrides: Partial<DataModel> = {}): DataModel {
  return {
    kind: "dataModel",
    id: "model-1",
    name: "Model",
    tables: [],
    relationships: [],
    measures: [],
    ...overrides,
  };
}
