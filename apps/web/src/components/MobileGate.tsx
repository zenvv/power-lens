import { Monitor } from "lucide-react";
import { SearchSparkleColor } from "@fluentui/react-icons";

/** Power Lens é uma ferramenta de desktop — ler e navegar num IR de app/fluxo
 * exige tela e espaço que mobile não tem. Em vez de tentar adaptar o layout,
 * telas pequenas caem aqui: só a mensagem, sem tentar renderizar o app. */
export function MobileGate() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-8 text-center text-foreground">
      <div className="flex items-center gap-2">
        <SearchSparkleColor className="size-6" />
        <span className="font-heading text-base font-semibold">Power Lens</span>
      </div>

      <Monitor className="size-10 text-muted-foreground" strokeWidth={1.5} />

      <div className="space-y-1">
        <p className="text-sm font-medium">Disponível apenas para desktop</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Abra este link em um computador pra ler e navegar pelos artefatos da Power
          Platform.
        </p>
      </div>
    </div>
  );
}
