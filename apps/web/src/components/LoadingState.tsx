import { FileScan } from "lucide-react";

type LoadingStateProps = {
  fileName: string;
};

/** Estado rápido de "lendo o arquivo" — parsing roda no browser e costuma
 * ser quase instantâneo, então isso não tenta simular progresso por etapas
 * (seria falso pra maioria dos arquivos); só confirma o que está
 * acontecendo e onde. */
export function LoadingState({ fileName }: LoadingStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <FileScan className="size-6 animate-pulse text-primary" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium">
          Lendo <span className="text-muted-foreground">{fileName}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Tudo acontece no seu navegador — o arquivo não sai da sua máquina.
        </p>
      </div>
    </div>
  );
}
