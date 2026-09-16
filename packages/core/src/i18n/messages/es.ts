import type { en } from "./en.js";

export const es = {
  rules: {
    pl001: {
      label: "Pantalla huérfana",
      message: (p: { screenName: string }) =>
        `La pantalla "${p.screenName}" no está referenciada por ninguna navegación encontrada en la app.`,
      hint: "La extracción de referencias es superficial (regex, no un parser completo de Power Fx) — confirme antes de eliminar la pantalla, puede haber un Navigate(...) en una expresión que el análisis no capturó.",
    },
    pl002: {
      label: "Control con nombre por defecto",
      message: (p: { controlName: string }) =>
        `El control "${p.controlName}" todavía tiene el nombre por defecto del Studio, nunca fue renombrado.`,
      hint: "Nombres descriptivos facilitan entender fórmulas que referencian el control más adelante.",
    },
    pl003: {
      label: "Fuente de datos nunca referenciada",
      message: (p: { dataSourceName: string }) =>
        `La fuente de datos "${p.dataSourceName}" está declarada pero no se encontró en ninguna fórmula de la app.`,
      hint: "La extracción de referencias es superficial — confirme antes de eliminar la conexión, puede usarse solo dentro de un componente o en una expresión que el análisis no capturó.",
    },
    pl004: {
      label: "GUID fijo en fórmula",
      message: (p: { count: number; propertyName: string }) =>
        p.count > 1
          ? `${p.count} GUIDs fijos encontrados en "${p.propertyName}".`
          : `GUID fijo encontrado en "${p.propertyName}".`,
      hint: "Los GUID de lista/tabla/entorno pegados directamente en la fórmula no sobreviven a una migración entre entornos.",
    },
    pl005: {
      label: "App.OnStart demasiado largo",
      optionLabel: "Líneas máximas",
      message: (p: { lineCount: number; maxLines: number }) =>
        `App.OnStart tiene ${p.lineCount} líneas (por encima del umbral de ${p.maxLines}).`,
      hint: "Considere dividirlo en componentes reutilizables o mover parte de la lógica a funciones con nombre.",
    },
    pl006: {
      label: "Fórmula duplicada entre controles",
      optionLabel: "Ocurrencias mínimas",
      message: (p: { preview: string; count: number }) =>
        `La fórmula ${p.preview} se repite en ${p.count} controles diferentes.`,
      hint: (p: { controls: string[] }) => `Controles: ${p.controls.join(", ")}`,
    },
    pl007: {
      label: "Propiedad de accesibilidad vacía",
      message: (p: { controlName: string; controlType: string }) =>
        `El control "${p.controlName}" (${p.controlType}) no tiene AccessibleLabel — un lector de pantalla no puede describirlo.`,
      hint: "Configure AccessibleLabel con un texto corto que describa la acción/contenido del control.",
    },
    pl008: {
      label: "Función sin delegación sobre datos remotos",
      message: (p: { functions: string; dataSources: string; propertyName: string }) =>
        `${p.functions} sobre ${p.dataSources} en "${p.propertyName}" — nunca delega; solo se procesa la primera página de la fuente remota.`,
      hint: "Considere reemplazarla por Filter/Sort (delegables, según el conector) antes de recorrer el resultado.",
    },
    pl009: {
      label: "Conector premium en uso",
      message: (p: { dataSourceName: string; connectorId: string }) =>
        `La fuente de datos "${p.dataSourceName}" usa el conector "${p.connectorId}", que es premium.`,
      hint: "Confirme que todo usuario de la app tenga la licencia necesaria (Power Apps por app/por usuario o equivalente) para este conector.",
    },
    pl010: {
      label: "Relación inactiva",
      message: (p: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }) =>
        `La relación ${p.fromTable}.${p.fromColumn} → ${p.toTable}.${p.toColumn} está inactiva.`,
      hint: "Solo se aplica explícitamente mediante USERELATIONSHIP en una medida DAX — confirme que sea intencional.",
    },
    pl011: {
      label: "Acción crítica sin manejo de fallos",
      message: (p: { actionName: string; connectorOrType: string }) =>
        `La acción "${p.actionName}" (${p.connectorOrType}) no tiene ningún paso que maneje su fallo.`,
      hint: 'Agregue un paso con "Configurar ejecución después de" (runAfter Failed/TimedOut) para esta acción, o confirme que un fallo silencioso aquí sea aceptable.',
    },
    pl012: {
      label: "Foreach anidado",
      message: (p: { nodeName: string }) => `"${p.nodeName}" es un Foreach anidado dentro de otro Foreach.`,
      hint: "Un Foreach anidado es secuencial por naturaleza y escala mal — considere aplanar la lista con Select/Filter array antes de un único bucle.",
    },
    pl013: {
      label: "Tabla/columna del modelo nunca referenciada",
      messageTable: (p: { tableName: string }) =>
        `La tabla "${p.tableName}" no aparece en ninguna relación ni fórmula encontrada en el modelo.`,
      hintTable:
        "La búsqueda es textual, no un parser completo de DAX/M — confirme antes de eliminarla, puede usarse de una forma que el análisis no capturó.",
      messageColumn: (p: { tableName: string; columnName: string }) =>
        `La columna "${p.tableName}.${p.columnName}" no aparece en ninguna relación ni fórmula encontrada en el modelo.`,
      hintColumn:
        "La búsqueda es textual, no un parser completo de DAX/M — confirme antes de eliminarla, puede usarse solo en un visual del informe.",
    },
    pl014: {
      label: "Relación con forma riesgosa",
      message: (p: { fromTable: string; fromColumn: string; toTable: string; toColumn: string; reasons: string }) =>
        `La relación ${p.fromTable}.${p.fromColumn} → ${p.toTable}.${p.toColumn} tiene una forma riesgosa: ${p.reasons}.`,
      reasons: {
        bidirectional: "filtrado cruzado bidireccional",
        manyToMany: "cardinalidad muchos a muchos",
      },
      hint: "Confirme que sea intencional — el filtrado bidireccional y muchos a muchos son fuentes comunes de resultados incorrectos en medidas DAX.",
    },
    pl015: {
      label: "Contraste texto/fondo por debajo de lo recomendado",
      message: (p: { ratio: string; path: string }) =>
        `Contraste de ${p.ratio}:1 entre texto y fondo en "${p.path}", por debajo del mínimo recomendado (4.5:1).`,
      hint: "Solo se calcula cuando Fill/Color resuelven a un color totalmente opaco (literal o RGBA constante) — el texto grande tiene un umbral menor (3:1), no diferenciado aquí.",
    },
  },
} satisfies typeof en;
