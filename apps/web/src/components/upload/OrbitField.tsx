import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { animate, useAnimationFrame, useReducedMotion } from "motion/react";
import { ORBIT_EDGES, ORBIT_NODES } from "./orbit-config";

type OrbitFieldProps = {
  /** Dispara a convergência dos nodos pro centro (início do loading). */
  collapsing: boolean;
  onCollapseComplete?: () => void;
};

/** Campo de referência (px) em que os raios de orbit-config.ts foram
 * desenhados — a órbita real escala por `min(largura, altura) / REFERENCE_SIZE`. */
const REFERENCE_SIZE = 520;
const CHIP_SIZE = 56;

type Position = { x: number; y: number };

const NODE_INDEX_BY_ID = new Map(ORBIT_NODES.map((node, i) => [node.id, i]));
const EDGE_NODE_INDICES = ORBIT_EDGES.map(
  ([fromId, toId]) => [NODE_INDEX_BY_ID.get(fromId)!, NODE_INDEX_BY_ID.get(toId)!] as const,
);

/**
 * Fundo decorativo da tela de upload: nodos dos apps da Power Platform
 * orbitando o dropzone central, com drift orgânico (não é um keyframe CSS
 * fixo — cada nodo tem velocidade angular e "respiração" radial próprias) e
 * linhas de conexão desenhando as integrações reais entre eles. Posição é
 * escrita direto no DOM via ref a cada frame (fora do ciclo de render do
 * React) por performance; só a convergência final pro centro usa a `motion`
 * (spring) porque aí sim queremos a física dela.
 */
export function OrbitField({ collapsing, onCollapseComplete }: OrbitFieldProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const positionsRef = useRef<Position[]>(ORBIT_NODES.map(() => ({ x: 0, y: 0 })));
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

  const paint = useCallback(() => {
    const positions = positionsRef.current;
    ORBIT_NODES.forEach((node, i) => {
      const pos = positions[i]!;
      const el = nodeRefs.current[i];
      if (el) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    });
    EDGE_NODE_INDICES.forEach(([fromIndex, toIndex], i) => {
      const line = lineRefs.current[i];
      if (!line) return;
      const from = positions[fromIndex]!;
      const to = positions[toIndex]!;
      line.setAttribute("x1", String(from.x));
      line.setAttribute("y1", String(from.y));
      line.setAttribute("x2", String(to.x));
      line.setAttribute("y2", String(to.y));
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
    positionsRef.current = ORBIT_NODES.map((node) => ({
      x: Math.cos(node.angle) * node.radius * scaleRef.current,
      y: Math.sin(node.angle) * node.radius * scaleRef.current,
    }));
    paint();

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]!.contentRect;
      applySize(width, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [applySize, paint]);

  useAnimationFrame((time) => {
    if (reduceMotion || !runningRef.current || collapseStartedRef.current) return;
    const t = time / 1000;
    const scale = scaleRef.current;
    positionsRef.current = ORBIT_NODES.map((node) => {
      const angle = node.angle + node.angularSpeed * t;
      const r = node.radius * scale + node.wobbleAmp * Math.sin(t * node.wobbleFreq + node.phase);
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
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
    const tasks = ORBIT_NODES.map((_, i) => {
      const el = nodeRefs.current[i];
      if (!el) return Promise.resolve();
      const pos = positionsRef.current[i]!;
      const delay = reduceMotion ? 0 : i * 0.018;
      return reduceMotion
        ? animate(el, { opacity: [1, 0] }, { duration })
        : animate(el, { x: [pos.x, 0], y: [pos.y, 0], scale: [1, 0.3], opacity: [1, 0] }, { duration, ease, delay });
    });
    if (svgRef.current) {
      tasks.push(animate(svgRef.current, { opacity: [1, 0] }, { duration: duration * 0.7 }));
    }
    void Promise.all(tasks).then(() => onCollapseCompleteRef.current?.());
  }, [collapsing, reduceMotion]);

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg ref={svgRef} className="absolute inset-0 h-full w-full">
        <g ref={groupRef}>
          {ORBIT_EDGES.map(([from, to], i) => (
            <line
              key={`${from}-${to}`}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className="stroke-foreground/12"
              strokeWidth={1}
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
            key={node.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-full border border-border/60 bg-card/90 backdrop-blur-sm"
            style={{
              width: CHIP_SIZE,
              height: CHIP_SIZE,
              marginLeft: -CHIP_SIZE / 2,
              marginTop: -CHIP_SIZE / 2,
              boxShadow: `0 10px 24px -10px ${node.tint}, 0 1px 2px rgba(0,0,0,0.08)`,
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
