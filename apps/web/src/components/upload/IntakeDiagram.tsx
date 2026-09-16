import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/context";
import { SOURCE_NODES } from "./intake-nodes";

type IntakeDiagramProps = {
  /** Dispara o "fechamento" do diagrama pra dar lugar ao loading. */
  collapsing: boolean;
  onCollapseComplete?: () => void;
  /** Segmento B: o próprio dropzone, posicionado pelo diagrama. */
  children: ReactNode;
};

const NODE_SIZE = 56;
const RESULT_SIZE = 96;

type Point = { x: number; y: number };

type Positions = {
  nodes: Point[];
  dropzoneIn: Point | null;
  dropzoneOut: Point | null;
  result: Point | null;
};

/** Insere um canal alfa numa cor `oklch(L C H)` -> `oklch(L C H / a)`. */
function withAlpha(oklch: string, alpha: number): string {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

/**
 * Tutorial visual da tela de import: 3 segmentos lidos da esquerda pra
 * direita — os apps de onde vem o arquivo (A), o próprio dropzone (B, via
 * `children`) e uma prévia do resultado (C, o arquivo virando conteúdo
 * legível). Linhas convergem dos 4 nodos de A pra uma única linha que entra
 * em B, e de B sai uma última linha pra C — em gradiente da cor do nodo até
 * cinza, ganhando um leve fluxo (stroke-dashoffset) pra sugerir dado em
 * movimento. Substitui o antigo campo de órbita: aqui as posições vêm de
 * medição real do layout (flex comum), não de física — não há nada girando
 * pra medir a cada frame.
 */
export function IntakeDiagram({
  collapsing,
  onCollapseComplete,
  children,
}: IntakeDiagramProps) {
  const { t } = useI18n();
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Positions>({
    nodes: [],
    dropzoneIn: null,
    dropzoneOut: null,
    result: null,
  });

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const pointAt = (el: HTMLElement, edge: "right" | "left"): Point => {
      const r = el.getBoundingClientRect();
      return {
        x: (edge === "right" ? r.right : r.left) - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
      };
    };

    const nodes = nodeRefs.current.map((el) =>
      el ? pointAt(el, "right") : { x: 0, y: 0 },
    );
    const dropzoneIn = dropzoneRef.current
      ? pointAt(dropzoneRef.current, "left")
      : null;
    const dropzoneOut = dropzoneRef.current
      ? pointAt(dropzoneRef.current, "right")
      : null;
    const result = resultRef.current
      ? pointAt(resultRef.current, "left")
      : null;

    setPositions({ nodes, dropzoneIn, dropzoneOut, result });
  }, []);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  const ready =
    positions.dropzoneIn &&
    positions.dropzoneOut &&
    positions.result &&
    positions.nodes.length > 0;

  return (
    <motion.div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-between"
      animate={
        collapsing ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }
      }
      transition={{
        duration: reduceMotion ? 0.12 : 0.32,
        ease: [0.16, 1, 0.3, 1],
      }}
      onAnimationComplete={() => {
        if (collapsing) onCollapseComplete?.();
      }}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          {SOURCE_NODES.map((node, i) => (
            <linearGradient
              key={node.id}
              id={`${gradientId}-source-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={positions.nodes[i]?.x ?? 0}
              y1={positions.nodes[i]?.y ?? 0}
              x2={positions.dropzoneIn?.x ?? 0}
              y2={positions.dropzoneIn?.y ?? 0}
            >
              <stop offset="0%" stopColor={withAlpha(node.tint, 0.8)} />
              <stop offset="100%" stopColor={withAlpha(node.tint, 0.35)} />
            </linearGradient>
          ))}
          <linearGradient
            id={`${gradientId}-outcome`}
            gradientUnits="userSpaceOnUse"
            x1={positions.dropzoneOut?.x ?? 0}
            y1={positions.dropzoneOut?.y ?? 0}
            x2={positions.result?.x ?? 0}
            y2={positions.result?.y ?? 0}
          >
            <stop
              offset="0%"
              stopColor="var(--muted-foreground)"
              stopOpacity={0.55}
            />
            <stop
              offset="100%"
              stopColor="var(--sidebar-primary)"
              stopOpacity={0.85}
            />
          </linearGradient>
        </defs>

        {ready &&
          SOURCE_NODES.map((node, i) => {
            const from = positions.nodes[i]!;
            const to = positions.dropzoneIn!;
            const midX = from.x + (to.x - from.x) * 0.62;
            return (
              <path
                key={node.id}
                className="power-lens-flow-line"
                d={`M ${from.x} ${from.y} C ${midX * 2} ${from.y}, ${midX} ${to.y}, ${to.x * 5} ${to.y - 8}`}
                fill="none"
                stroke={`url(#${gradientId}-source-${i})`}
                strokeWidth={1.75}
                strokeLinecap="round"
              />
            );
          })}

        {ready && (
          <path
            d={`M ${positions.dropzoneOut!.x} ${positions.dropzoneOut!.y - 11} L ${positions.result!.x - 200} ${positions.result!.y}`}
            fill="none"
            stroke={`url(#${gradientId}-outcome)`}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeDasharray="1 6"
          />
        )}
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        {SOURCE_NODES.map((node, i) => (
          <motion.div
            key={node.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            title={node.label}
            className="flex items-center justify-center rounded-full border backdrop-blur-sm"
            style={{
              translateX: i == 2 || i == 1 ? 0 : -30,
              width: NODE_SIZE,
              height: NODE_SIZE,
              borderColor: withAlpha(node.tint, 0.2),
              backgroundColor: withAlpha(node.tint, 0.16),
              boxShadow: `0 2px 16px ${withAlpha(node.tint, 0.2)}`,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: reduceMotion ? 0.15 : 0.4,
              ease: [0.16, 1, 0.3, 1],
              delay: reduceMotion ? 0 : i * 0.08,
            }}
          >
            <img src={node.icon} alt="" className="size-6 object-contain" />
          </motion.div>
        ))}
      </div>

      <motion.div
        ref={dropzoneRef}
        className="relative z-10 flex flex-1 items-center justify-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: reduceMotion ? 0.15 : 0.45,
          ease: [0.16, 1, 0.3, 1],
          delay: reduceMotion ? 0 : 0.2,
        }}
      >
        {children}
      </motion.div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center gap-2"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: reduceMotion ? 0.15 : 0.4,
          ease: [0.16, 1, 0.3, 1],
          delay: reduceMotion ? 0 : 0.35,
        }}
      >
        <div
          ref={resultRef}
          className="flex items-center justify-center border rounded-full p-3 border-sidebar-primary/50 border-dashed bg-linear-to-t from-sidebar-primary/20 to-transparent"
          style={{ width: RESULT_SIZE, height: RESULT_SIZE }}
        >
          <img
            src="/images/text_content.webp"
            alt={t.home.diagramOutcomeAlt}
            className="size-full object-contain"
          />
        </div>
        <p className="max-w-24 shimmer text-center text-[11px] text-muted-foreground">
          {t.home.diagramOutcomeLabel}
        </p>
      </motion.div>
    </motion.div>
  );
}
