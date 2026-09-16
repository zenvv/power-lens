import type { FlowNode } from "../ir/index.js";

/**
 * Categoria de alto nível de um gatilho, pra uma UI escolher ícone/rótulo
 * sem precisar conhecer cada `type` de trigger do Workflow Definition
 * Language. Texto exibido (como isso vira "roda todo dia às 9h" numa tela)
 * fica por conta de quem consome — este módulo só classifica e repassa os
 * dados brutos já presentes no IR.
 */
export type TriggerCategory = "scheduled" | "manual" | "event" | "unknown";

export type TriggerSummary = {
  category: TriggerCategory;
  type: string;
  connectorName?: string;
  /** Presente só quando `category === "scheduled"` — repasse bruto de
   * `FlowNode.recurrence`, sem parsear frequência/intervalo aqui. */
  recurrence?: unknown;
};

/** Tipos de trigger manual/sob demanda conhecidos — não tem agendamento nem
 * conector, alguém aciona na hora (botão no app, chamada HTTP direta). */
const MANUAL_TRIGGER_TYPES = new Set(["Request", "Manual"]);

function categorize(trigger: FlowNode): TriggerCategory {
  if (trigger.recurrence !== undefined || trigger.type === "Recurrence") return "scheduled";
  if (MANUAL_TRIGGER_TYPES.has(trigger.type)) return "manual";
  if (trigger.connectorName !== undefined) return "event";
  return "unknown";
}

/** Classifica o gatilho de um `CloudFlow` sem precisar entender toda a
 * variedade de `type` do Workflow Definition Language — usa só os campos já
 * extraídos no IR (`recurrence`, `connectorName`, `type`). */
export function summarizeTrigger(trigger: FlowNode): TriggerSummary {
  return {
    category: categorize(trigger),
    type: trigger.type,
    ...(trigger.connectorName !== undefined ? { connectorName: trigger.connectorName } : {}),
    ...(trigger.recurrence !== undefined ? { recurrence: trigger.recurrence } : {}),
  };
}
