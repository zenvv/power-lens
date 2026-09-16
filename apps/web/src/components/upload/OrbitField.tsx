import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import { animate, useAnimationFrame, useReducedMotion } from "motion/react";
import { ORBIT_EDGES, ORBIT_NODES } from "./orbit-config";

type OrbitFieldProps = {
  /** Dispara a convergência dos nodos pro centro (início do loading). */
  collapsing: boolean;
  onCollapseComplete?: () => void;
};

/** Campo de referência (px) em que os raios abaixo foram desenhados — a
 * órbita real escala por `min(largura, altura) / REFERENCE_SIZE`. */
const REFERENCE_SIZE = 520;
/** Raio único do anel principal: todos os nodos "reais" moram nele, deixando
 * uma área vazia generosa no centro pro dropzone. */
const MAIN_RADIUS = 190;
const CHIP_SIZE = 56;

/** Segunda cópia dos mesmos nodos — menor, mais transparente, num raio maior
 * e girando mais devagar — só pra dar sensação de profundidade (leitura de
 * "camada mais distante"). Puramente decorativa: sem linhas de conexão. */
const GHOST_RADIUS_RATIO = 1.24;
const GHOST_SCALE = 0.56;
const GHOST_OPACITY = 0.32;
const GHOST_SPEED_RATIO = 0.55;
const GHOST_ANGLE_OFFSET = Math.PI / ORBIT_NODES.length; // intercalado, não atrás do nodo real

type Position = { x: number; y: number };

const NODE_INDEX_BY_ID = new Map(ORBIT_NODES.map((node, i) => [node.id, i]));
const EDGE_NODE_INDICES = ORBIT_EDGES.map(
  ([fromId, toId]) => [NODE_INDEX_BY_ID.get(fromId)!, NODE_INDEX_BY_ID.get(toId)!] as const,
);

/** Insere um canal alfa numa cor `oklch(L C H)` -> `oklch(L C H / a)`. */
function withAlpha(oklch: string, alpha: number): string {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

function emptyPositions(): Position[] {
  return ORBIT_NODES.map(() => ({ x: 0, y: 0 }));
}

/**
 * Fundo decorativo da tela de upload: nodos dos apps da Power Platform e do
 * Microsoft 365 orbitando o dropzone central num único anel, com drift
 * orgânico (velocidade angular + "respiração" radial próprias por nodo, não
 * um keyframe CSS fixo) e linhas de conexão coloridas (gradiente entre a cor
 * de cada ponta) desenhando as integrações reais entre eles. Uma segunda
 * cópia menor/mais transparente dos mesmos nodos, num raio maior e mais
 * lenta, dá profundidade. Posição é escrita direto no DOM via ref a cada
 * frame (fora do ciclo de render do React) por performance; só a
 * convergência final pro centro usa a `motion` (tween) porque aí sim
 * queremos orquestração de biblioteca.
 */
export function OrbitField({ collapsing, onCollapseComplete }: OrbitFieldProps) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ghostRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const gradientRefs = useRef<(SVGLinearGradientElement | null)[]>([]);
  const positionsRef = useRef<Position[]>(emptyPositions());
  const ghostPositionsRef = useRef<Position[]>(emptyPositions());
  const scaleRef = useRef(1);
  const runningRef = useRef(true);
  const collapseStartedRef = useRef(false);
  const onCollapseCompleteRef = useRef(onCollapseComplete);
  onCollapseCompleteRef.current = onCollapseComplete;

  const applySize = useCallback((width: number, height: number) => {
    scaleRef.current = Math.min(width, height) / REFERENCE_SIZE;
    if (groupRef.current) {
      groupRef.current.setAttribute("transform", `translate(${width / 2} ${height / 2})`);
    }
  }, []);

  const computePositions = useCallback((t: number) => {
    const scale = scaleRef.current;
    const main = ORBIT_NODES.map((node) => {
      const angle = node.angle + node.angularSpeed * t;
      const r = MAIN_RADIUS * scale + node.wobbleAmp * Math.sin(t * node.wobbleFreq + node.phase);
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
    const ghost = ORBIT_NODES.map((node) => {
      const angle = node.angle + GHOST_ANGLE_OFFSET + node.angularSpeed * GHOST_SPEED_RATIO * t;
      const r =
        MAIN_RADIUS * GHOST_RADIUS_RATIO * scale +
        node.wobbleAmp * 0.7 * Math.sin(t * node.wobbleFreq + node.phase + 1.2);
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
    return { main, ghost };
  }, []);

  const paint = useCallback(() => {
    const positions = positionsRef.current;
    const ghostPositions = ghostPositionsRef.current;
    ORBIT_NODES.forEach((_, i) => {
      const pos = positions[i]!;
      const el = nodeRefs.current[i];
      if (el) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const ghostPos = ghostPositions[i]!;
      const ghostEl = ghostRefs.current[i];
      if (ghostEl) ghostEl.style.transform = `translate3d(${ghostPos.x}px, ${ghostPos.y}px, 0)`;
    });
    EDGE_NODE_INDICES.forEach(([fromIndex, toIndex], i) => {
      const line = lineRefs.current[i];
      const gradient = gradientRefs.current[i];
      if (!line && !gradient) return;
      const from = positions[fromIndex]!;
      const to = positions[toIndex]!;
      line?.setAttribute("x1", String(from.x));
      line?.setAttribute("y1", String(from.y));
      line?.setAttribute("x2", String(to.x));
      line?.setAttribute("y2", String(to.y));
      if (gradient) {
        gradient.setAttribute("x1", String(from.x));
        gradient.setAttribute("y1", String(from.y));
        gradient.setAttribute("x2", String(to.x));
        gradient.setAttribute("y2", String(to.y));
      }
    });
  }, []);

  // Mede o container de forma síncrona antes do primeiro paint (evita um
  // frame com a órbita em escala 1:1 antes do ResizeObserver reportar o
  // tamanho real) e mantém a escala atualizada em resizes seguintes.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    applySize(rect.width, rect.height);
    const { main, ghost } = computePositions(0);
    positionsRef.current = main;
    ghostPositionsRef.current = ghost;
    paint();

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]!.contentRect;
      applySize(width, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [applySize, computePositions, paint]);

  useAnimationFrame((time) => {
    if (reduceMotion || !runningRef.current || collapseStartedRef.current) return;
    const { main, ghost } = computePositions(time / 1000);
    positionsRef.current = main;
    ghostPositionsRef.current = ghost;
    paint();
  });

  useEffect(() => {
    if (!collapsing || collapseStartedRef.current) return;
    collapseStartedRef.current = true;
    runningRef.current = false;

    // "tween" em vez de "spring": o objetivo aqui não é física, é uma
    // duração previsível — uma spring só "termina" (resolve a promise)
    // quando a velocidade cai abaixo de um limiar, o que na prática ficava
    // bem mais lento do que o olho já percebia como "sumiu".
    const duration = reduceMotion ? 0.22 : 0.42;
    const ease = [0.16, 1, 0.3, 1] as const; // expo-out
    const collapseOne = (el: HTMLDivElement | null, pos: Position, i: number) => {
      if (!el) return Promise.resolve();
      const delay = reduceMotion ? 0 : i * 0.014;
      return reduceMotion
        ? animate(el, { opacity: [1, 0] }, { duration })
        : animate(el, { x: [pos.x, 0], y: [pos.y, 0], scale: [1, 0.3], opacity: [1, 0] }, { duration, ease, delay });
    };
    const tasks = ORBIT_NODES.map((_, i) => collapseOne(nodeRefs.current[i] ?? null, positionsRef.current[i]!, i));
    ORBIT_NODES.forEach((_, i) => {
      tasks.push(collapseOne(ghostRefs.current[i] ?? null, ghostPositionsRef.current[i]!, i));
    });
    if (svgRef.current) {
      tasks.push(animate(svgRef.current, { opacity: [1, 0] }, { duration: duration * 0.7 }));
    }
    void Promise.all(tasks).then(() => onCollapseCompleteRef.current?.());
  }, [collapsing, reduceMotion]);

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg ref={svgRef} className="absolute inset-0 h-full w-full">
        <defs>
          {ORBIT_EDGES.map(([fromId, toId], i) => {
            const from = ORBIT_NODES[NODE_INDEX_BY_ID.get(fromId)!]!;
            const to = ORBIT_NODES[NODE_INDEX_BY_ID.get(toId)!]!;
            return (
              <linearGradient
                key={`grad-${fromId}-${toId}`}
                id={`${gradientId}-edge-${i}`}
                gradientUnits="userSpaceOnUse"
                ref={(el) => {
                  gradientRefs.current[i] = el;
                }}
              >
                <stop offset="0%" stopColor={withAlpha(from.tint, 0.45)} />
                <stop offset="100%" stopColor={withAlpha(to.tint, 0.45)} />
              </linearGradient>
            );
          })}
        </defs>
        <g ref={groupRef}>
          {ORBIT_EDGES.map(([from, to], i) => (
            <line
              key={`${from}-${to}`}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              stroke={`url(#${gradientId}-edge-${i})`}
              strokeWidth={1.25}
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>

      {ORBIT_NODES.map((node, i) => {
        const Icon = node.visual.kind === "icon" ? node.visual.Icon : null;
        return (
          <div
            key={`ghost-${node.id}`}
            ref={(el) => {
              ghostRefs.current[i] = el;
            }}
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full border backdrop-blur-sm"
            style={{
              width: CHIP_SIZE * GHOST_SCALE,
              height: CHIP_SIZE * GHOST_SCALE,
              marginLeft: (-CHIP_SIZE * GHOST_SCALE) / 2,
              marginTop: (-CHIP_SIZE * GHOST_SCALE) / 2,
              borderColor: withAlpha(node.tint, 0.5),
              backgroundColor: withAlpha(node.tint, 0.12),
              opacity: GHOST_OPACITY,
            }}
          >
            {node.visual.kind === "image" ? (
              <img src={node.visual.src} alt="" className="size-3.5 object-contain" />
            ) : (
              Icon && <Icon className="size-3.5" />
            )}
          </div>
        );
      })}

      {ORBIT_NODES.map((node, i) => {
        const Icon = node.visual.kind === "icon" ? node.visual.Icon : null;
        return (
          <div
            key={node.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full border backdrop-blur-sm"
            style={{
              width: CHIP_SIZE,
              height: CHIP_SIZE,
              marginLeft: -CHIP_SIZE / 2,
              marginTop: -CHIP_SIZE / 2,
              borderColor: withAlpha(node.tint, 0.8),
              backgroundColor: withAlpha(node.tint, 0.16),
            }}
            title={node.label}
          >
            {node.visual.kind === "image" ? (
              <img src={node.visual.src} alt="" className="size-6 object-contain" />
            ) : (
              Icon && <Icon className="size-6" />
            )}
          </div>
        );
      })}
    </div>
  );
}
