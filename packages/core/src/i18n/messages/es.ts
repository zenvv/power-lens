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
  parsers: {
    common: {
      noName: "(sin nombre)",
      unknown: "(desconocida)",
      missing: "(ausente)",
    },
    detect: {
      pbipPointerOnly: {
        message:
          "Los archivos .pbip son solo un puntero; el proyecto real está en carpetas hermanas (Report/, SemanticModel/) que no se incluyeron.",
        hint: "Suba la carpeta completa del proyecto, no solo el archivo .pbip.",
      },
      notZipOrFlow: "Formato no reconocido: el archivo no es un zip ni un JSON de definición de flujo.",
      zipCantOpen: (p: { error: string }) => `El archivo tiene firma de zip pero no se pudo abrir: ${p.error}`,
      zipNoSignature:
        "Formato no reconocido: es un zip, pero sin solution.xml, Src/*.pa.yaml, DataModelSchema ni DataModel.",
      extensionFallback: (p: { ext: string }) =>
        `Formato asumido por la extensión "${p.ext}" — la estructura interna del zip no coincidió con ninguna firma conocida.`,
    },
    msapp: {
      cantOpenZip: (p: { error: string }) => `No se pudo abrir el archivo como zip: ${p.error}`,
      extractedFromPackage: (p: { path: string }) =>
        `El archivo era un paquete de exportación de Power Apps Studio; el .msapp se extrajo automáticamente de "${p.path}".`,
      cantOpenExtracted: (p: { path: string; error: string }) =>
        `Se encontró "${p.path}" dentro del paquete, pero no se pudo abrir como .msapp: ${p.error}`,
      multipleMsappFound: (p: { paths: string }) =>
        `Se encontraron varios archivos .msapp dentro del paquete (${p.paths}); no es posible determinar cuál analizar.`,
      flowFolderFound: (p: { count: number }) =>
        `El paquete de exportación también contiene Microsoft.Flow/ (${p.count} archivo(s) de flujo), que todavía no se analiza en esta fase.`,
      childrenItemNotObject: "El elemento de Children no es un objeto; se omitió.",
      childrenItemEmptyObject: "El elemento de Children es un objeto vacío; se omitió.",
      dataSourcesInvalidJson: (p: { path: string; error: string }) => `${p.path} no es un JSON válido: ${p.error}`,
      propertiesNotFound: (p: { path: string }) =>
        `${p.path} no se encontró; se usa el nombre del archivo como id/nombre de la app.`,
      propertiesInvalidJson: (p: { path: string; error: string }) => `${p.path} no es un JSON válido: ${p.error}`,
      yamlParseError: (p: { error: string }) => `Error al interpretar YAML: ${p.error}`,
      screenOrderInferred: {
        message:
          "El orden de las pantallas se infirió por el orden alfabético de los archivos Src/*.pa.yaml, no por una fuente autoritativa del Studio.",
        hint: "Ver docs/FORMAT-NOTES.md — el orden real de pantallas es una limitación conocida.",
      },
    },
    flow: {
      invalidJson: (p: { error: string }) => `No se pudo interpretar el archivo como JSON: ${p.error}`,
      notObjectAtRoot: "El JSON no representa un objeto en el nivel raíz.",
      definitionNotFound: {
        message: 'No encontré "triggers"/"actions" en el nivel raíz ni en "properties.definition".',
        hint: "Formato de definición de flujo todavía no verificado contra un archivo real — ver docs/FORMAT-NOTES.md sección 4.",
      },
      noTrigger: 'No se encontró ningún disparador en "triggers".',
      multipleTriggers: (p: { count: number; firstKey: string }) =>
        `Se encontraron ${p.count} disparadores; un flujo normalmente tiene exactamente uno. Usando "${p.firstKey}".`,
      noTriggerFallbackName: "(sin disparador)",
    },
    solution: {
      cantOpenZip: (p: { error: string }) => `No se pudo abrir el archivo como zip: ${p.error}`,
      solutionXmlNotFound: "solution.xml no se encontró en el zip; los metadatos de la solution no estarán disponibles.",
      customizationsNoTables: "Se encontró customizations.xml, pero no se reconoció ninguna tabla de Dataverse en él.",
      noArtifactsRecognized:
        "No se reconoció ningún artefacto dentro de la solution (ni CanvasApps/*.msapp, ni Workflows/*.json, ni un solution.xml válido).",
      solutionXmlInvalid: (p: { error: string }) => `solution.xml no es un XML válido: ${p.error}`,
      solutionXmlUnexpectedShape: {
        message: "solution.xml no tiene la forma esperada (no se encontró ImportExportXml/SolutionManifest).",
        hint: "Formato todavía no verificado contra un archivo real — ver docs/FORMAT-NOTES.md sección 2.",
      },
      solutionXmlNoUniqueName: "solution.xml no tiene UniqueName.",
      unknownSolutionName: "Solution desconocida",
      customizationsInvalidXml: (p: { error: string }) => `customizations.xml no es un XML válido: ${p.error}`,
      relationshipTypeUnrecognized: (p: { name: string; type: string }) =>
        `Relación "${p.name}" con EntityRelationshipType "${p.type}" no reconocido; se omitió.`,
      dataverseTablesName: "Tablas de Dataverse",
      childFlowNotFound: {
        message: (p: { actionName: string; ref: string }) =>
          `La acción "${p.actionName}" parece invocar otro flujo (referencia "${p.ref}"), pero no se encontró ningún flujo con ese nombre en esta solution.`,
        hint: "El flujo hijo puede estar fuera de esta solution/entorno, o la coincidencia por nombre falló — extracción no verificada contra un definition.json real.",
      },
    },
    powerbi: {
      cardinalityUnexpected: (p: { from: string; to: string }) =>
        `Relación con cardinalidad "${p.from}"/"${p.to}" fuera de lo esperado ("one"/"many"); tratada como muchos-a-uno.`,
      cantOpenZip: (p: { error: string }) => `No se pudo abrir el archivo como zip: ${p.error}`,
      dataModelSchemaNotFound: 'No encontré "DataModelSchema" dentro del archivo.',
      dataModelSchemaInvalidJson: (p: { error: string }) => `"DataModelSchema" no es un JSON válido: ${p.error}`,
      modelTablesNotFound: 'No encontré "model.tables" en DataModelSchema; el modelo se trató como vacío.',
      reportLayoutInvalidJson: (p: { error: string }) => `"Report/Layout" no es un JSON válido: ${p.error}`,
      reportSectionsNotFound: 'No encontré "sections" en "Report/Layout"; el informe se trató como sin páginas.',
      pageFallback: (p: { n: number }) => `Página ${p.n}`,
      reportName: "Informe",
    },
  },
  render: {
    summary: {
      formatLabel: {
        msapp: ".msapp (Canvas App)",
        solution: "Solution .zip",
        flow: "Definición de flujo",
        pbit: ".pbit",
        pbip: ".pbip",
        pbix: ".pbix",
      },
      format: "Formato:",
      size: "Tamaño:",
      analyzedAt: "Analizado el:",
      parserVersion: "Versión del parser:",
      artifacts: "Artefactos:",
    },
    solutionMeta: {
      heading: (p: { name: string }) => `Solution: ${p.name}`,
      id: "Id:",
      version: "Versión:",
      publisher: "Publisher:",
    },
    dataModel: {
      heading: (p: { name: string }) => `Modelo de datos: ${p.name}`,
      tables: "Tablas:",
      relationships: "Relaciones:",
      measures: "Medidas:",
      tableHeading: (p: { name: string }) => `Tabla: ${p.name}`,
      columnTableHeader: "| Columna | Tipo | Calculada |",
      yes: "sí",
      no: "no",
      relationshipsHeading: "Relaciones",
      inactiveSuffix: ", inactiva",
      measuresHeading: "Medidas",
    },
    report: {
      heading: (p: { name: string }) => `Informe: ${p.name}`,
      pageHeading: (p: { name: string }) => `Página: ${p.name}`,
      untitled: "(sin título)",
      none: "ninguno",
      fieldsPrefix: "campos:",
    },
    diagnostics: {
      heading: "Diagnósticos",
      none: "Sin diagnósticos.",
      tableHeader: "| Severidad | Código | Mensaje | Ruta |",
    },
    canvasApp: {
      heading: (p: { name: string }) => `App Canvas: ${p.name}`,
      id: "Id:",
      screens: "Pantallas:",
      components: "Componentes:",
      dataSources: "Fuentes de datos:",
      variables: "Variables/colecciones:",
      onStartHeading: "OnStart de la app",
      dataSourcesHeading: "Fuentes de datos",
      variablesHeading: "Variables y colecciones",
      screenHeading: (p: { name: string }) => `Pantalla: ${p.name}`,
      componentHeading: (p: { name: string }) => `Componente: ${p.name}`,
    },
    cloudFlow: {
      heading: (p: { name: string }) => `Flujo: ${p.name}`,
      id: "Id:",
      trigger: "Disparador:",
      actions: "Acciones:",
      connections: "Conexiones:",
      none: "ninguna",
      actionsHeading: "Acciones",
      branchSuffix: (p: { branch: string }) => `, branch "${p.branch}"`,
      insideParent: (p: { parentId: string; branch: string }) => ` (dentro de ${p.parentId}${p.branch})`,
    },
  },
  contextPack: {
    promptMd: (p: { fileName: string; format: string }) => `# Instrucciones para el LLM

Recibiste un paquete de contexto generado por Power Lens sobre el archivo
"${p.fileName}" (${p.format}).

El archivo \`ir.json\` de este paquete es una representación estructural
completa y determinística del artefacto — pantallas, controles, fórmulas,
fuentes de datos, flujos, tablas, según corresponda. \`summary.md\` es la
misma información ya formateada como documentación legible.

Use **solo** el contenido de \`ir.json\`/\`summary.md\` como fuente de verdad
sobre la estructura del artefacto. No invente controles, pantallas, fuentes
de datos ni fórmulas que no aparezcan en estos archivos.

Tareas sugeridas (adapte según su necesidad):

1. Escriba un resumen en lenguaje natural de lo que hace este artefacto.
2. Liste riesgos o puntos de atención que observe en la estructura (nombres
   genéricos de control, fórmulas repetidas, dependencias externas).
3. Sugiera un plan de prueba manual que cubra los principales flujos de
   pantalla.

Los diagnósticos en \`ir.json\` (campo \`diagnostics\`) señalan problemas que
Power Lens ya detectó estructuralmente — no repita estos hallazgos como
propios, pero puede ampliarlos.
`,
    readmeTitle: "Power Lens — paquete de contexto",
    readmeBody: (p: { fileName: string; format: string; parsedAt: string }) => `Archivo original: ${p.fileName}
Formato: ${p.format}
Generado el: ${p.parsedAt}

Contenido de este paquete:

- ir.json      -> representación estructural completa del artefacto (la IR de Power Lens)
- summary.md   -> la misma información, ya formateada como documentación Markdown
- PROMPT.md    -> instrucciones listas para pegar en un LLM (ChatGPT, Copilot, etc.)

Cómo usar: abra una conversación con el LLM de su preferencia, pegue el
contenido de PROMPT.md y luego pegue el contenido de ir.json (o adjunte el
archivo, si el LLM acepta adjuntos). Ningún archivo original de Power
Platform está en este paquete — solo la estructura extraída por Power Lens.
`,
  },
} satisfies typeof en;
