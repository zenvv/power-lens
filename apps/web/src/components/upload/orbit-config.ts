import { GlobeColor, MoleculeColor, type FluentIcon } from "@fluentui/react-icons";
import commondataserviceforapps from "@/assets/connector-icons/commondataserviceforapps.png";
import excelonlinebusiness from "@/assets/connector-icons/excelonlinebusiness.png";
import office365 from "@/assets/connector-icons/office365.png";
import powerbi from "@/assets/connector-icons/powerbi.png";
import sharepointonline from "@/assets/connector-icons/sharepointonline.png";
import teams from "@/assets/connector-icons/teams.png";
import powerapps from "@/assets/orbit-icons/powerapps.webp";
import powerautomate from "@/assets/orbit-icons/powerautomate.webp";

export type OrbitNodeVisual = { kind: "image"; src: string } | { kind: "icon"; Icon: FluentIcon };

export type OrbitNodeConfig = {
  id: string;
  label: string;
  visual: OrbitNodeVisual;
  /** Cor do contorno/fundo do chip e das conexões que tocam esse nodo — extraída
   * da própria imagem/ícone (média das cores mais saturadas dos pixels não
   * transparentes, ponderada por saturação), não escolhida de memória. Ver
   * `docs/changelog` deste incremento pro script usado. */
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
    visual: { kind: "image", src: powerapps },
    tint: "oklch(0.60 0.15 335)",
    angle: angleFor(0),
    angularSpeed: 0.05,
    wobbleAmp: 12,
    wobbleFreq: 0.34,
    phase: 0,
  },
  {
    id: "automate",
    label: "Power Automate",
    visual: { kind: "image", src: powerautomate },
    tint: "oklch(0.61 0.17 258)",
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
    tint: "oklch(0.56 0.14 151)",
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
    tint: "oklch(0.64 0.11 206)",
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
    tint: "oklch(0.79 0.15 86)",
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
    tint: "oklch(0.60 0.14 144)",
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
    tint: "oklch(0.62 0.16 251)",
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
    tint: "oklch(0.58 0.18 279)",
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
    tint: "oklch(0.63 0.16 252)",
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
    tint: "oklch(0.70 0.12 183)",
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
 * recalculada por distância entre nodos.
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

// --- Camada "fantasma": nodos menores/mais transparentes espalhados como
// galhos ao redor do anel principal, só por profundidade. Posições vêm de um
// PRNG com seed fixa (não Math.random()) pra ficarem estáveis entre
// remontagens do componente, mas sem seguir a ordem/ângulo dos nodos reais.

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type GhostNodeConfig = {
  nodeIndex: number;
  angle: number;
  radiusRatio: number;
  angularSpeed: number;
  wobbleAmp: number;
  wobbleFreq: number;
  phase: number;
  sizeRatio: number;
  opacity: number;
};

const GHOST_COUNT = 18;
const rand = mulberry32(20260915);

export const GHOST_NODES: readonly GhostNodeConfig[] = Array.from({ length: GHOST_COUNT }, () => ({
  nodeIndex: Math.floor(rand() * ORBIT_NODES.length),
  angle: rand() * TAU,
  radiusRatio: 0.72 + rand() * 1.0, // 0.72x–1.72x MAIN_RADIUS: espalhado, não um segundo anel limpo
  angularSpeed: (rand() - 0.5) * 0.07,
  wobbleAmp: 6 + rand() * 12,
  wobbleFreq: 0.18 + rand() * 0.32,
  phase: rand() * TAU,
  sizeRatio: 0.34 + rand() * 0.3,
  opacity: 0.2 + rand() * 0.2,
}));

/** Conexões esparsas entre nodos-fantasma (índices em GHOST_NODES), tipo
 * galhos — não uma malha, só alguns pares aleatórios. */
export const GHOST_EDGES: readonly [number, number][] = (() => {
  const edges: [number, number][] = [];
  for (let i = 0; i < GHOST_COUNT; i++) {
    if (rand() < 0.4) {
      const j = Math.floor(rand() * GHOST_COUNT);
      if (j !== i) edges.push([i, j]);
    }
  }
  return edges;
})();
