import { motion, useReducedMotion } from "motion/react";
import { CalendarClock, File, HardDrive, Sparkles, Tag } from "lucide-react";
import {
  FlashFlowRegular,
  DatabaseMultipleRegular,
  AppsRegular,
  PuzzleCubePieceRegular,
  WarningShieldRegular,
} from "@fluentui/react-icons";
import { buildContextPack, type PowerLensDocument } from "@power-lens/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { downloadBytes } from "@/lib/download";
import { useI18n } from "@/lib/i18n/context";
import { SectionHeader } from "@/components/document/SectionHeader";
import { StatTile } from "@/components/document/StatTile";
import docHeartIllustration from "@/assets/images/doc-heart.webp";
import aiIllustration from "@/assets/images/ai.webp";
import summaryBackground from "@/assets/images/summary-bg.jpg";
import { Separator } from "../ui/separator";

type SummarySectionProps = {
  document: PowerLensDocument;
  flowsCount: number;
  modelsCount: number;
  canvasAppsCount: number;
  onDownloadMarkdown: () => void;
  onDownloadIr: () => void;
  onRequestAiExplanation: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

/** Atraso entre a entrada de um card e o próximo, na cascata de fade-in do
 * carregamento da página (ver `cardEntrance`). */
const CARD_ENTRANCE_STEP = 0.06;

/** Página de Resumo de um documento analisado — extraída do `DocumentView`
 * porque cresceu estilo próprio (wallpaper, vidro fosco, ilustrações,
 * animação de entrada) que não tem relação com o resto das abas. */
export function SummarySection({
  document,
  flowsCount,
  modelsCount,
  canvasAppsCount,
  onDownloadMarkdown,
  onDownloadIr,
  onRequestAiExplanation,
}: SummarySectionProps) {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const severityCounts = { error: 0, warning: 0, info: 0 };
  for (const d of document.diagnostics) severityCounts[d.severity]++;

  const onDownloadContextPack = () => {
    const zipBytes = buildContextPack(document, locale);
    downloadBytes(
      zipBytes,
      `${document.source.fileName}.power-lens-pack.zip`,
      "application/zip",
    );
  };

  /** Fade-in de baixo pra cima, em cascata por card — desligado se o
   * usuário pediu menos movimento (`prefers-reduced-motion`). */
  function cardEntrance(index: number) {
    if (reduceMotion) return {};
    return {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: 0.4,
        delay: index * CARD_ENTRANCE_STEP,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    };
  }

  return (
    <div className="flex flex-col gap-4 p-6 flex-1 shrink-0">
      {/* Wallpaper decorativo: só nesta seção, atrás das superfícies de
       * vidro fosco dos cards abaixo (`bg-card/*` + `backdrop-blur`).
       * `isolate` cria um stacking context próprio no wrapper — sem ele, o
       * `-z-10` escaparia pra trás do painel branco (`bg-background`)
       * inteiro em vez de só atrás dos irmãos aqui dentro. */}
      <motion.img
        src={summaryBackground}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full scale-[110%] w-full left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 object-cover opacity-30 dark:saturate-50 dark:opacity-20 mask-t-from-0 mask-l-from-20%"
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 0.3, scale: 1.1 }}
        transition={{
          duration: 2,
          delay: 0,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      <SectionHeader
        title={t.summary.title}
        description={
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <File className="size-3.5 shrink-0" />
              {document.source.detectedFormat}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HardDrive className="size-3.5 shrink-0" />
              {formatBytes(document.source.fileSize)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5 shrink-0" />
              {new Date(document.source.parsedAt).toLocaleString(t.summary.dateLocale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-3.5 shrink-0" />
              {t.summary.parserPrefix} {document.source.parserVersion}
            </span>
          </span>
        }
      />
      <div className="flex items-start justify-start gap-4 flex-1 shrink-0 w-full mt-4">
        <div className="flex flex-col gap-3 min-w-96">
          <motion.div className="h-full" {...cardEntrance(0)}>
            <StatTile
              icon={PuzzleCubePieceRegular}
              label={t.summary.stats.artifacts}
              value={document.artifacts.length}
            />
          </motion.div>
          <motion.div className="h-full" {...cardEntrance(1)}>
            <StatTile
              icon={FlashFlowRegular}
              label={t.summary.stats.flows}
              value={flowsCount}
            />
          </motion.div>
          <motion.div className="h-full" {...cardEntrance(2)}>
            <StatTile
              icon={DatabaseMultipleRegular}
              label={t.summary.stats.models}
              value={modelsCount}
            />
          </motion.div>
          <motion.div className="h-full" {...cardEntrance(3)}>
            <StatTile
              icon={AppsRegular}
              label={t.summary.stats.apps}
              value={canvasAppsCount}
            />
          </motion.div>
          <motion.div className="h-full" {...cardEntrance(4)}>
            <StatTile
              icon={WarningShieldRegular}
              label={t.summary.stats.diagnostics}
              value={document.diagnostics.length}
              detail={t.summary.diagnosticsDetail({
                errors: severityCounts.error,
                warnings: severityCounts.warning,
                infos: severityCounts.info,
              })}
            />
          </motion.div>
        </div>
        <Separator orientation="vertical" className="h-full mx-4" />
        <div className="flex flex-col gap-4 flex-1 shrink-0">
          <motion.div {...cardEntrance(5)}>
            <Card className="relative overflow-hidden bg-card/60 shadow-md backdrop-blur-xl dark:bg-card/40 p-0 hover:bg-card transition-all group">
              <div className="relative flex items-center gap-0">
                <img
                  src={docHeartIllustration}
                  alt=""
                  className="hidden size-28 shrink-0 object-contain ml-2 drop-shadow-lg sm:block p-2 saturate-0 group-hover:saturate-100 transition-all"
                />
                <div className="min-w-0 flex-1">
                  <CardHeader className="gap-0.5">
                    <CardTitle>{t.summary.exportTitle}</CardTitle>
                    <CardDescription>{t.summary.exportDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-3 flex flex-wrap gap-2">
                    <Button size="lg" onClick={onDownloadMarkdown}>
                      {t.summary.downloadDocButton}
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={onDownloadIr}
                    >
                      {t.summary.downloadIrButton}
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={onDownloadContextPack}
                    >
                      {t.summary.downloadContextPackButton}
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...cardEntrance(6)}>
            <Card className="relative overflow-hidden bg-card/60 shadow-md backdrop-blur-xl dark:bg-card/40 p-0 hover:bg-card transition-all group">
              <div className="relative flex items-center gap-0">
                <img
                  src={aiIllustration}
                  alt=""
                  className="hidden size-28 shrink-0 object-contain ml-4 drop-shadow-lg sm:block p-2 saturate-0 group-hover:saturate-100 transition-all"
                />
                <div className="min-w-0 flex-1">
                  <CardHeader className="gap-0.5">
                    <CardTitle>{t.summary.aiTitle}</CardTitle>
                    <CardDescription>{t.summary.aiDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-3">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={onRequestAiExplanation}
                    >
                      <Sparkles /> {t.summary.aiButton}
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
