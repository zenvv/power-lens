import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileStack, ShieldCheck, Wand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { Dropzone } from "./Dropzone";
import { LoadingState } from "./LoadingState";
import { OrbitField } from "./upload/OrbitField";
import type { AppState } from "@/lib/app-state";

type HomeSectionProps = {
  state: AppState;
  onFile: (file: File) => void;
  onRetry: () => void;
};

const TRUST_FACT_ICONS = [ShieldCheck, Wand, FileStack];

type GatePhase = "idle" | "collapsing" | "done";

/** Tela de "início" do app — cobre idle, loading e unrecognized. Fica no
 * lugar de uma página de import separada: mesma navegação lateral e mesma
 * barra superior continuam montadas ao redor dela (quando existem — ver
 * App.tsx sobre por que a navegação lateral não existe em `idle`).
 *
 * `phase` é só coreografia visual (o orbit field convergindo pro centro),
 * independente do `state.status` real: a análise (`onFile`) dispara em
 * paralelo com a animação de colapso, então um arquivo grande nunca espera
 * a coreografia — ela só garante que a "porta de entrada" nunca desaparece
 * de um jeito abrupto, mesmo quando o parsing termina antes dela acabar. */
export function HomeSection({ state, onFile, onRetry }: HomeSectionProps) {
  const { t } = useI18n();
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
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="flex max-w-lg flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-semibold text-balance">
          {t.home.titleBefore}
          <b className="font-semibold text-sidebar-primary italic">
            Power Platform
          </b>
          {t.home.titleAfter}
        </h1>
        <p className="text-sm text-muted-foreground text-balance">{t.home.subtitle}</p>
      </div>

      {/* Tamanho fixo (não fluxo normal): gate/loading/erro trocam por cima
       * um do outro via position:absolute. Em fluxo normal, o bloco de
       * loading que entra ficava empurrado centenas de px pra baixo pelo
       * "gate" ainda ocupando espaço enquanto termina de sumir (opacity vai
       * a 0, mas a caixa de 520px de altura continua lá até desmontar). */}
      <div className="relative aspect-square w-full max-w-130">
        <AnimatePresence>
          {showGate ? (
            <motion.div
              key="gate"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <OrbitField
                collapsing={phase === "collapsing"}
                onCollapseComplete={() => setPhase("done")}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2"
                style={{
                  background:
                    "radial-gradient(circle, var(--background) 0%, var(--background) 42%, transparent 74%)",
                }}
              />
              <Dropzone
                onFile={handleDroppedFile}
                disabled={phase !== "idle"}
              />
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
      </div>

      {phase === "idle" && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {t.home.trustFacts.map((label, i) => {
            const Icon = TRUST_FACT_ICONS[i]!;
            return (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
