import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/context";

type LoadingStateProps = {
  fileName: string;
  stage: string;
};

/** Estado de "lendo o arquivo". O parsing em si costuma ser quase
 * instantâneo (App.tsx impõe um piso de exibição pra não flashar); o texto
 * que troca aqui reflete as etapas reais do pipeline (analyze.ts), não um
 * progresso fabricado — só a duração mínima é uma escolha de design. */
export function LoadingState({ fileName, stage }: LoadingStateProps) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-1 flex-col items-center justify-center gap-4 py-24"
    >
      <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10">
        <div className="size-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium">
          {t.loadingState.reading} <span className="text-muted-foreground">{fileName}</span>
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-muted-foreground"
          >
            {stage}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
