import {
  Box,
  Braces,
  Clock,
  Code,
  CornerUpLeft,
  GitBranch,
  Globe,
  OctagonX,
  Repeat,
  Shuffle,
  Timer,
  Variable,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Ícone por tipo de action/trigger pra blocos sem conector (If, Foreach,
 * Scope, Compose, etc. são passos internos do próprio motor de fluxo, não
 * chamam nenhuma API externa — spec seção 5 / Workflow Definition Language).
 * Tipo fora do mapa cai no ícone genérico `Workflow` (fallback honesto: o
 * viewer não inventa qual é o step, só mostra que é um passo interno).
 */
export const FLOW_ACTION_TYPE_ICONS: Readonly<Record<string, LucideIcon>> = {
  If: GitBranch,
  Switch: Shuffle,
  Scope: Box,
  Foreach: Repeat,
  InitializeVariable: Variable,
  SetVariable: Variable,
  IncrementVariable: Variable,
  AppendToArrayVariable: Variable,
  Compose: Code,
  ParseJson: Braces,
  Terminate: OctagonX,
  Response: CornerUpLeft,
  Request: Webhook,
  Recurrence: Clock,
  Http: Globe,
  Wait: Timer,
};

export const FLOW_ACTION_FALLBACK_ICON: LucideIcon = Workflow;
