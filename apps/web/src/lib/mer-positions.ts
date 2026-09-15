/**
 * Posição manual de cada tabela no MER viewer, persistida em localStorage por
 * modelo (spec seção 7: "layout automático + arrasto manual persistido em
 * localStorage"). Só guarda posição — nunca dados do arquivo original.
 */

export type TablePosition = { x: number; y: number };

const KEY_PREFIX = "power-lens:mer-positions:";

export function loadPositions(modelId: string): Record<string, TablePosition> {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + modelId);
    return raw ? (JSON.parse(raw) as Record<string, TablePosition>) : {};
  } catch {
    // Storage indisponível (modo privado, cota cheia, etc.) — degrada para
    // "sem posição salva" em vez de quebrar o viewer.
    return {};
  }
}

export function savePosition(modelId: string, tableName: string, position: TablePosition): void {
  try {
    const current = loadPositions(modelId);
    current[tableName] = position;
    localStorage.setItem(KEY_PREFIX + modelId, JSON.stringify(current));
  } catch {
    // Idem — arrasto simplesmente não persiste, sem quebrar a interação.
  }
}
