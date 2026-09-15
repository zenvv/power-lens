import { FileStack, ShieldCheck, Wand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "./Dropzone";
import { LoadingState } from "./LoadingState";
import type { AppState } from "@/lib/app-state";

type HomeSectionProps = {
  state: AppState;
  onFile: (file: File) => void;
  onRetry: () => void;
};

const TRUST_FACTS = [
  { icon: ShieldCheck, label: "100% local — nada sai da sua máquina" },
  { icon: Wand, label: "Determinístico por padrão — IA é uma camada opcional" },
  { icon: FileStack, label: ".msapp · solution .zip · flow · .pbit/.pbip" },
];

/** Tela de "início" do app — cobre idle, loading e unrecognized. Fica no
 * lugar de uma página de import separada: mesma navegação lateral e mesma
 * barra superior continuam montadas ao redor dela. */
export function HomeSection({ state, onFile, onRetry }: HomeSectionProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex max-w-lg flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-semibold text-balance">
          Entenda um artefato da Power Platform
        </h1>
        <p className="text-sm text-muted-foreground text-balance">
          Solte um arquivo pra ver o resumo estrutural, a visualização e a documentação gerada — sem abrir o
          Studio, sem ambiente.
        </p>
      </div>

      {state.status === "loading" && <LoadingState fileName={state.fileName} />}

      {state.status !== "loading" && state.status !== "unrecognized" && (
        <Dropzone onFile={onFile} disabled={false} />
      )}

      {state.status === "unrecognized" && (
        <div className="flex w-[min(480px,90vw)] flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-5">
          <p className="text-sm">
            Não consegui reconhecer <strong>{state.fileName}</strong> como um arquivo suportado.
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {state.diagnostics.map((d, i) => (
              <li key={i}>{d.message}</li>
            ))}
          </ul>
          <Button variant="outline" className="self-start" onClick={onRetry}>
            Tentar outro arquivo
          </Button>
        </div>
      )}

      {state.status !== "loading" && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUST_FACTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3.5 shrink-0" />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
