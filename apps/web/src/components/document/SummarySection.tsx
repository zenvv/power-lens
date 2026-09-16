import { motion, useReducedMotion } from "motion/react";
import { CalendarClock, File, HardDrive, Sparkles, Tag } from "lucide-react";
import {
  CloudColor,
  DatabaseColor,
  PhoneLaptopColor,
  PuzzlePieceColor,
  WarningColor,
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
import { SectionHeader } from "@/components/document/SectionHeader";
import { StatTile } from "@/components/document/StatTile";
import docHeartIllustration from "@/assets/images/doc-heart.webp";
import aiIllustration from "@/assets/images/ai.webp";
import summaryBackground from "@/assets/images/summary-bg.jpg";

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
  const reduceMotion = useReducedMotion();
  const severityCounts = { error: 0, warning: 0, info: 0 };
  for (const d of document.diagnostics) severityCounts[d.severity]++;

  const onDownloadContextPack = () => {
    const zipBytes = buildContextPack(document);
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
    <div className="relative isolate flex flex-col gap-4 pb-6">
      {/* Wallpaper decorativo: só nesta seção, atrás das superfícies de
       * vidro fosco dos cards abaixo (`bg-card/*` + `backdrop-blur`).
       * `isolate` cria um stacking context próprio no wrapper — sem ele, o
       * `-z-10` escaparia pra trás do painel branco (`bg-background`)
       * inteiro em vez de só atrás dos irmãos aqui dentro. */}
      <img
        src={summaryBackground}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-30 dark:mix-blend-soft-light dark:opacity-20"
      />

      <SectionHeader
        title="Resumo"
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
              {new Date(document.source.parsedAt).toLocaleString("pt-BR")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-3.5 shrink-0" />
              parser {document.source.parserVersion}
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <motion.div className="h-full" {...cardEntrance(0)}>
          <StatTile
            icon={PuzzlePieceColor}
            label="artefato(s)"
            value={document.artifacts.length}
          />
        </motion.div>
        <motion.div className="h-full" {...cardEntrance(1)}>
          <StatTile icon={CloudColor} label="fluxo(s)" value={flowsCount} />
        </motion.div>
        <motion.div className="h-full" {...cardEntrance(2)}>
          <StatTile
            icon={DatabaseColor}
            label="modelo(s) de dados"
            value={modelsCount}
          />
        </motion.div>
        <motion.div className="h-full" {...cardEntrance(3)}>
          <StatTile
            icon={PhoneLaptopColor}
            label="canvas app(s)"
            value={canvasAppsCount}
          />
        </motion.div>
        <motion.div className="h-full" {...cardEntrance(4)}>
          <StatTile
            icon={WarningColor}
            label="diagnóstico(s)"
            value={document.diagnostics.length}
            detail={`${severityCounts.error} erro(s), ${severityCounts.warning} aviso(s), ${severityCounts.info} info`}
          />
        </motion.div>
      </div>

      <motion.div {...cardEntrance(5)}>
        <Card className="relative overflow-hidden bg-card/60 shadow-md backdrop-blur-xl dark:bg-card/40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-amber-300),transparent_65%)]/35 dark:bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-amber-500),transparent_65%)]/18"
          />
          <div className="relative flex items-center gap-4">
            <img
              src={docHeartIllustration}
              alt=""
              className="hidden size-24 shrink-0 object-contain pl-4 drop-shadow-lg sm:block"
            />
            <div className="min-w-0 flex-1">
              <CardHeader className="gap-0.5">
                <CardTitle>Exportar</CardTitle>
                <CardDescription>
                  Tudo gerado no navegador, nada sai da sua máquina.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-3 flex flex-wrap gap-2">
                <Button size="lg" onClick={onDownloadMarkdown}>
                  Baixar documentação (.md)
                </Button>
                <Button size="lg" variant="secondary" onClick={onDownloadIr}>
                  Baixar IR (ir.json)
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={onDownloadContextPack}
                >
                  Baixar pacote de contexto (.zip)
                </Button>
              </CardContent>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div {...cardEntrance(6)}>
        <Card className="relative overflow-hidden bg-card/60 shadow-md backdrop-blur-xl dark:bg-card/40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-violet-300),transparent_65%)]/35 dark:bg-[radial-gradient(120%_140%_at_100%_0%,var(--color-violet-500),transparent_65%)]/20"
          />
          <div className="relative flex items-center gap-4">
            <img
              src={aiIllustration}
              alt=""
              className="hidden size-24 shrink-0 object-contain pl-4 drop-shadow-lg sm:block"
            />
            <div className="min-w-0 flex-1">
              <CardHeader className="gap-0.5">
                <CardTitle>Explicação por IA</CardTitle>
                <CardDescription>
                  Opcional: peça pra um LLM explicar este artefato em
                  linguagem natural, com a sua própria chave.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onRequestAiExplanation}
                >
                  <Sparkles /> Gerar explicação por IA
                </Button>
              </CardContent>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
