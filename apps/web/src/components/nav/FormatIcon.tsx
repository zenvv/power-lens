import type { PowerLensDocument, Artifact } from "@power-lens/core";
import {
  AppGenericRegular,
  BoxRegular,
  ChartMultipleRegular,
  DatabaseRegular,
  FlowchartRegular,
  PuzzlePieceRegular,
  type FluentIcon,
} from "@fluentui/react-icons";

type FormatIconProps = {
  document: PowerLensDocument;
  className?: string;
};

const KIND_ICON: Record<Artifact["kind"], FluentIcon> = {
  canvasApp: AppGenericRegular,
  cloudFlow: FlowchartRegular,
  dataModel: DatabaseRegular,
  report: ChartMultipleRegular,
  solutionMeta: BoxRegular,
};

/** Um solution.zip mistura tipos de artefato (app + fluxo + modelo); nesse
 * caso nenhum ícone de um tipo só representaria o arquivo, daí o ícone de
 * "peças combinadas" em vez de tentar escolher um dos tipos presentes. */
export function FormatIcon({ document, className = "" }: FormatIconProps) {
  const kinds = new Set(document.artifacts.map((a) => a.kind));
  const Icon =
    kinds.size === 1 ? KIND_ICON[[...kinds][0]!] : kinds.size > 1 ? PuzzlePieceRegular : BoxRegular;

  return <Icon className={className} />;
}
