import { AppsColor, ArrowSyncColor, GlobeColor, type FluentIcon } from "@fluentui/react-icons";
import commondataserviceforapps from "@/assets/connector-icons/commondataserviceforapps.png";
import excelonlinebusiness from "@/assets/connector-icons/excelonlinebusiness.png";
import powerbi from "@/assets/connector-icons/powerbi.png";
import sharepointonline from "@/assets/connector-icons/sharepointonline.png";

export type OrbitNodeVisual = { kind: "image"; src: string } | { kind: "icon"; Icon: FluentIcon };

export type OrbitNodeConfig = {
  id: string;
  label: string;
  visual: OrbitNodeVisual;
  /** Cor usada no glow suave por trás do chip — não tenta replicar a marca
   * oficial nos 3 apps sem asset de logo no repo (ver connector-icons.ts). */
  tint: string;
  /** Raio de referência (px) num campo de ~520px; escalado em runtime pelo
   * tamanho real do container. */
  radius: number;
  /** Ângulo inicial, em radianos. */
  angle: number;
  /** Velocidade angular, rad/s — sinal define o sentido da órbita. */
  angularSpeed: number;
  /** Amplitude (px) da respiração radial que quebra a órbita perfeitamente circular. */
  wobbleAmp: number;
  wobbleFreq: number;
  phase: number;
};

const TAU = Math.PI * 2;

export const ORBIT_NODES: readonly OrbitNodeConfig[] = [
  {
    id: "powerapps",
    label: "Power Apps",
    visual: { kind: "icon", Icon: AppsColor },
    tint: "oklch(0.55 0.19 306)",
    radius: 168,
    angle: (0 / 7) * TAU,
    angularSpeed: 0.052,
    wobbleAmp: 14,
    wobbleFreq: 0.34,
    phase: 0,
  },
  {
    id: "automate",
    label: "Power Automate",
    visual: { kind: "icon", Icon: ArrowSyncColor },
    tint: "oklch(0.55 0.17 250)",
    radius: 118,
    angle: (1 / 7) * TAU,
    angularSpeed: -0.061,
    wobbleAmp: 10,
    wobbleFreq: 0.41,
    phase: 0.9,
  },
  {
    id: "dataverse",
    label: "Dataverse",
    visual: { kind: "image", src: commondataserviceforapps },
    tint: "oklch(0.55 0.12 222)",
    radius: 214,
    angle: (2 / 7) * TAU,
    angularSpeed: 0.045,
    wobbleAmp: 16,
    wobbleFreq: 0.29,
    phase: 1.8,
  },
  {
    id: "sharepoint",
    label: "SharePoint",
    visual: { kind: "image", src: sharepointonline },
    tint: "oklch(0.55 0.10 196)",
    radius: 118,
    angle: (3 / 7) * TAU,
    angularSpeed: -0.057,
    wobbleAmp: 11,
    wobbleFreq: 0.37,
    phase: 2.7,
  },
  {
    id: "powerbi",
    label: "Power BI",
    visual: { kind: "image", src: powerbi },
    tint: "oklch(0.78 0.16 82)",
    radius: 214,
    angle: (4 / 7) * TAU,
    angularSpeed: 0.049,
    wobbleAmp: 15,
    wobbleFreq: 0.32,
    phase: 3.6,
  },
  {
    id: "excel",
    label: "Excel",
    visual: { kind: "image", src: excelonlinebusiness },
    tint: "oklch(0.58 0.15 146)",
    radius: 168,
    angle: (5 / 7) * TAU,
    angularSpeed: -0.043,
    wobbleAmp: 13,
    wobbleFreq: 0.39,
    phase: 4.5,
  },
  {
    id: "pages",
    label: "Power Pages",
    visual: { kind: "icon", Icon: GlobeColor },
    tint: "oklch(0.55 0.20 341)",
    radius: 118,
    angle: (6 / 7) * TAU,
    angularSpeed: 0.063,
    wobbleAmp: 9,
    wobbleFreq: 0.44,
    phase: 5.4,
  },
];

/**
 * Conexões representam integrações reais entre esses produtos (Dataverse
 * como hub de dados, Automate como orquestrador), não proximidade
 * geométrica — por isso a topologia é fixa em vez de recalculada por
 * distância entre nodos.
 */
export const ORBIT_EDGES: readonly [string, string][] = [
  ["powerapps", "dataverse"],
  ["automate", "dataverse"],
  ["powerbi", "dataverse"],
  ["pages", "dataverse"],
  ["automate", "sharepoint"],
  ["automate", "excel"],
  ["powerbi", "excel"],
];
