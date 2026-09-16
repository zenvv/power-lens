import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileStack, ShieldCheck, Wand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StrokeText } from "@/components/ui/stroke-text";
import { useI18n } from "@/lib/i18n/context";
import { Dropzone } from "./Dropzone";
import { LoadingState } from "./LoadingState";
import { IntakeDiagram } from "./upload/IntakeDiagram";
import type { AppState } from "@/lib/app-state";

type HomeSectionProps = {
  state: AppState;
  onFile: (file: File) => void;
  onRetry: () => void;
};

const TRUST_FACT_ICONS = [ShieldCheck, Wand, FileStack];

type GatePhase = "idle" | "collapsing" | "done";

const ENTRANCE_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/** Tela de "início" do app — cobre idle, loading e unrecognized. Fica no
 * lugar de uma página de import separada: mesma navegação lateral e mesma
 * barra superior continuam montadas ao redor dela (quando existem — ver
 * App.tsx sobre por que a navegação lateral não existe em `idle`).
 *
 * `phase` é só coreografia visual (o diagrama de import encolhendo antes do
 * loading assumir), independente do `state.status` real: a análise
 * (`onFile`) dispara em paralelo com essa transição, então um arquivo grande
 * nunca espera a coreografia — ela só garante que a "porta de entrada" nunca
 * desaparece de um jeito abrupto, mesmo quando o parsing termina antes dela
 * acabar. */
export function HomeSection({ state, onFile, onRetry }: HomeSectionProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<GatePhase>("idle");

  useEffect(() => {
    if (state.status === "idle") setPhase("idle");
  }, [state.status]);

  function handleDroppedFile(file: File) {
    if (phase !== "idle") return;
    setPhase("collapsing");
    onFile(file);
  }

  const showGate = phase !== "done";

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: reduceMotion
            ? { staggerChildren: 0 }
            : { staggerChildren: 0.1, delayChildren: 0.05 },
        },
      }}
      className="flex flex-1 flex-col relative items-center justify-center gap-10 px-6 py-12 h-full shrink-0"
    >
      <div className="bg-radial to-primary blur-[999px] from-sidebar-primary inset-0 h-60 w-1/2 z-0 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bottom-0 dark:opacity-20 opacity-10"></div>
      <div className="flex max-w-lg flex-col items-center gap-2 text-center z-20">
        <motion.p
          className="uppercase text-muted-foreground text-sm tracking-wider"
          initial={{ opacity: 0, letterSpacing: "0.3em" }}
          animate={{ opacity: 1, letterSpacing: "0.05em" }}
          transition={{
            duration: 0.5,
            ease: "circInOut",
          }}
        >
          Power Lens ∙ Built by{" "}
          <a
            className="underline hover:text-sidebar-primary"
            href="https://www.github.com/zenvv/power-lens/"
            target="_blank"
          >
            zenvv
          </a>
        </motion.p>
        <motion.h1
          variants={ENTRANCE_ITEM}
          className="flex flex-wrap items-center justify-center gap-x-0 gap-y-1 font-heading text-2xl font-semibold text-balance"
        >
          <span>{t.home.titleBefore}</span>
          <StrokeText
            text="Power Platform"
            italic
            fontSize={34}
            fontWeight={600}
            letterSpacing={-0.5}
            strokeWidth={1.5}
            fillDelay={0}
            className="text-sidebar-primary m-0"
          />
          <span>{t.home.titleAfter}</span>
        </motion.h1>
        <motion.p
          variants={ENTRANCE_ITEM}
          className="text-sm text-muted-foreground text-balance"
        >
          {t.home.subtitle}
        </motion.p>
      </div>

      {/* Altura fixa (não fluxo normal): gate/loading/erro trocam por cima
       * um do outro via position:absolute. Em fluxo normal, o bloco de
       * loading que entra ficava empurrado pra baixo pelo "gate" ainda
       * ocupando espaço enquanto termina de sumir. */}
      <motion.div
        variants={ENTRANCE_ITEM}
        className="relative h-1/2 w-full max-w-2xl z-20"
      >
        <AnimatePresence>
          {showGate ? (
            <motion.div
              key="gate"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              <IntakeDiagram
                collapsing={phase === "collapsing"}
                onCollapseComplete={() => setPhase("done")}
              >
                <Dropzone
                  onFile={handleDroppedFile}
                  disabled={phase !== "idle"}
                />
              </IntakeDiagram>
            </motion.div>
          ) : state.status === "loading" ? (
            <div
              key="loading"
              className="absolute inset-0 flex items-center justify-center"
            >
              <LoadingState fileName={state.fileName} stage={state.stage} />
            </div>
          ) : state.status === "unrecognized" ? (
            <motion.div
              key="unrecognized"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="flex w-[min(480px,90vw)] flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-5">
                <p className="text-sm">
                  {t.home.unrecognizedBefore}
                  <strong>{state.fileName}</strong>
                  {t.home.unrecognizedAfter}
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {state.diagnostics.map((d, i) => (
                    <li key={i}>{d.message}</li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="self-start"
                  onClick={onRetry}
                >
                  {t.home.tryAnotherFile}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {phase === "idle" && (
        <motion.div
          variants={{
            hidden: {},
            show: {
              transition: reduceMotion
                ? { staggerChildren: 0 }
                : { staggerChildren: 0.08 },
            },
          }}
          className="flex flex-wrap items-stretch justify-center gap-3 z-20"
        >
          {t.home.trustFacts.map((label, i) => {
            const Icon = TRUST_FACT_ICONS[i]!;
            return (
              <motion.div
                key={label}
                variants={ENTRANCE_ITEM}
                className="flex w-52 items-start gap-2.5 rounded-xl border bg-card/60 px-3.5 py-3 opacity-75! hover:opacity-100! hover:shadow-sm backdrop-blur-sm dark:bg-card/40 transition-all group select-none pl-2.5"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-linear-to-t from-muted to-muted/60 ">
                  <Icon className="size-3.5" />
                </div>
                <p className="text-xs leading-snug">{label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
