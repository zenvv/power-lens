/**
 * Cor por tipo de action interna (sem conector), agrupada por categoria como
 * no Power Automate — controle de fluxo, variáveis, operações de dados,
 * agendamento — em vez de tudo no mesmo cinza genérico. Não é uma cópia
 * pixel-a-pixel da paleta oficial, só a mesma ideia visual de dar uma cor
 * própria por categoria de action, junto com o ícone (`flow-action-icons.ts`).
 */
export const FLOW_ACTION_TYPE_COLORS: Readonly<Record<string, string>> = {
  If: "#8a5300",
  Switch: "#8a5300",
  Scope: "#8a5300",
  Foreach: "#8a5300",
  InitializeVariable: "#7719aa",
  SetVariable: "#7719aa",
  IncrementVariable: "#7719aa",
  AppendToArrayVariable: "#7719aa",
  Compose: "#036ac4",
  ParseJson: "#036ac4",
  Terminate: "#c4314b",
  Response: "#005ba1",
  Request: "#005ba1",
  Recurrence: "#487e02",
  Wait: "#487e02",
  Http: "#3999c6",
};
