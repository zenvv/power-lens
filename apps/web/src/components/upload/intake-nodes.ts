import commondataserviceforapps from "@/assets/connector-icons/commondataserviceforapps.png";
import powerbi from "@/assets/connector-icons/powerbi.png";
import powerapps from "@/assets/orbit-icons/powerapps.webp";
import powerautomate from "@/assets/orbit-icons/powerautomate.webp";

export type SourceNode = {
  id: string;
  label: string;
  icon: string;
  /** Cor do nodo e da ponta "colorida" da linha que sai dele — extraída da
   * própria imagem do ícone (média das cores mais saturadas dos pixels não
   * transparentes, ponderada por saturação), não escolhida de memória. */
  tint: string;
};

/** Os quatro pilares da Power Platform que o app lê — segmento A do diagrama
 * de intake (ver `IntakeDiagram`), na ordem em que normalmente se aprende
 * a plataforma: telas, automação, dados, relatórios. */
export const SOURCE_NODES: readonly SourceNode[] = [
  {
    id: "powerapps",
    label: "Power Apps",
    icon: powerapps,
    tint: "oklch(0.60 0.15 335)",
  },
  {
    id: "automate",
    label: "Power Automate",
    icon: powerautomate,
    tint: "oklch(0.61 0.17 258)",
  },
  {
    id: "dataverse",
    label: "Dataverse",
    icon: commondataserviceforapps,
    tint: "oklch(0.56 0.14 151)",
  },
  {
    id: "powerbi",
    label: "Power BI",
    icon: powerbi,
    tint: "oklch(0.79 0.15 86)",
  },
];
