import {
  AppsColor,
  ArrowClockwiseDashesColor,
  GlobeColor,
  MoleculeColor,
  type FluentIcon,
} from "@fluentui/react-icons";
import commondataserviceforapps from "@/assets/connector-icons/commondataserviceforapps.png";
import excelonlinebusiness from "@/assets/connector-icons/excelonlinebusiness.png";
import office365 from "@/assets/connector-icons/office365.png";
import powerbi from "@/assets/connector-icons/powerbi.png";
import sharepointonline from "@/assets/connector-icons/sharepointonline.png";
import teams from "@/assets/connector-icons/teams.png";

export type OrbitNodeVisual = { kind: "image"; src: string } | { kind: "icon"; Icon: FluentIcon };

export type OrbitNodeConfig = {
  id: string;
  label: string;
  visual: OrbitNodeVisual;
  /** Cor do contorno/fundo do chip e das conexões que tocam esse nodo — não
   * tenta replicar a marca oficial nos apps sem asset de logo no repo (ver
   * connector-icons.ts). */
  tint: string;
  /** Ângulo inicial no anel principal, em radianos — todos os nodos ficam
   * no mesmo raio (ver MAIN_RADIUS em OrbitField.tsx), formando um único
   * círculo em vez de anéis concêntricos, pra sobrar uma área vazia maior
   * no centro pro dropzone. */
  angle: number;
  /** Velocidade angular, rad/s — sinal define o sentido da órbita. */
  angularSpeed: number;
  /** Amplitude (px) da respiração radial que quebra a órbita perfeitamente circular. */
  wobbleAmp: number;
  wobbleFreq: number;
  phase: number;
};

const TAU = Math.PI * 2;
const NODE_COUNT = 10;
const angleFor = (i: number) => (i / NODE_COUNT) * TAU;

export const ORBIT_NODES: readonly OrbitNodeConfig[] = [
  {
    id: "powerapps",
    label: "Power Apps",
    visual: { kind: "icon", Icon: AppsColor },
    tint: "oklch(0.55 0.19 306)",
    angle: angleFor(0),
    angularSpeed: 0.05,
    wobbleAmp: 12,
    wobbleFreq: 0.34,
    phase: 0,
  },
  {
    id: "automate",
    label: "Power Automate",
    visual: { kind: "icon", Icon: ArrowClockwiseDashesColor },
    tint: "oklch(0.55 0.17 250)",
    angle: angleFor(1),
    angularSpeed: -0.045,
    wobbleAmp: 10,
    wobbleFreq: 0.4,
    phase: 0.7,
  },
  {
    id: "dataverse",
    label: "Dataverse",
    visual: { kind: "image", src: commondataserviceforapps },
    tint: "oklch(0.55 0.12 222)",
    angle: angleFor(2),
    angularSpeed: 0.04,
    wobbleAmp: 14,
    wobbleFreq: 0.29,
    phase: 1.4,
  },
  {
    id: "sharepoint",
    label: "SharePoint",
    visual: { kind: "image", src: sharepointonline },
    tint: "oklch(0.55 0.10 196)",
    angle: angleFor(3),
    angularSpeed: -0.052,
    wobbleAmp: 11,
    wobbleFreq: 0.37,
    phase: 2.1,
  },
  {
    id: "powerbi",
    label: "Power BI",
    visual: { kind: "image", src: powerbi },
    tint: "oklch(0.78 0.16 82)",
    angle: angleFor(4),
    angularSpeed: 0.047,
    wobbleAmp: 13,
    wobbleFreq: 0.31,
    phase: 2.8,
  },
  {
    id: "excel",
    label: "Excel",
    visual: { kind: "image", src: excelonlinebusiness },
    tint: "oklch(0.58 0.15 146)",
    angle: angleFor(5),
    angularSpeed: -0.043,
    wobbleAmp: 12,
    wobbleFreq: 0.39,
    phase: 3.5,
  },
  {
    id: "pages",
    label: "Power Pages",
    visual: { kind: "icon", Icon: GlobeColor },
    tint: "oklch(0.55 0.20 341)",
    angle: angleFor(6),
    angularSpeed: 0.056,
    wobbleAmp: 9,
    wobbleFreq: 0.44,
    phase: 4.2,
  },
  {
    id: "teams",
    label: "Microsoft Teams",
    visual: { kind: "image", src: teams },
    tint: "oklch(0.5 0.15 290)",
    angle: angleFor(7),
    angularSpeed: -0.049,
    wobbleAmp: 13,
    wobbleFreq: 0.36,
    phase: 4.9,
  },
  {
    id: "office365",
    label: "Microsoft 365",
    visual: { kind: "image", src: office365 },
    tint: "oklch(0.62 0.18 45)",
    angle: angleFor(8),
    angularSpeed: 0.041,
    wobbleAmp: 10,
    wobbleFreq: 0.42,
    phase: 5.6,
  },
  {
    id: "powerplatform",
    label: "Power Platform",
    visual: { kind: "icon", Icon: MoleculeColor },
    tint: "oklch(0.55 0.20 280)",
    angle: angleFor(9),
    angularSpeed: -0.058,
    wobbleAmp: 12,
    wobbleFreq: 0.33,
    phase: 6.3,
  },
];

/**
 * Conexões representam integrações reais entre esses produtos (Dataverse
 * como hub de dados, Automate como orquestrador pro resto do Microsoft
 * 365), não proximidade geométrica — por isso a topologia é fixa em vez de
 * recalculada por distância entre nodos. Mantida enxuta (9 arestas pra 10
 * nodos) porque as linhas agora são coloridas e ficam mais presentes
 * visualmente do que o traço cinza-claro da versão anterior.
 */
export const ORBIT_EDGES: readonly [string, string][] = [
  ["dataverse", "powerapps"],
  ["dataverse", "automate"],
  ["dataverse", "powerbi"],
  ["dataverse", "pages"],
  ["dataverse", "powerplatform"],
  ["automate", "sharepoint"],
  ["automate", "teams"],
  ["automate", "office365"],
  ["powerbi", "excel"],
];
