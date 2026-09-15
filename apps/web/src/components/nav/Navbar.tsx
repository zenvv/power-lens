import type { PowerLensDocument } from "@power-lens/core";
import { SearchSparkleColor } from "@fluentui/react-icons";
import { Menu, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { FormatIcon } from "./FormatIcon";

type NavbarProps = {
  document?: PowerLensDocument | null;
  onOpenDiagnostics: () => void;
  onToggleSidebar: () => void;
};

/** Barra superior fixa do app. Só identidade e status aqui — a ação de
 * trocar de arquivo mora na navegação lateral (item "Importar arquivo",
 * com confirmação), pra não duplicar o mesmo comando em dois lugares. */
function Navbar({ document, onOpenDiagnostics, onToggleSidebar }: NavbarProps) {
  return (
    <div className="flex h-12 w-full shrink-0 items-center gap-3 border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Abrir navegação"
        onClick={onToggleSidebar}
      >
        <Menu />
      </Button>

      <div className="flex shrink-0 items-center gap-2">
        <SearchSparkleColor className="size-5" />
        <span className="font-heading text-sm font-semibold">Power Lens</span>
      </div>

      {document && (
        <>
          <span className="h-5 w-px shrink-0 bg-border" />
          <div className="flex min-w-0 items-center gap-2">
            <FormatIcon document={document} className="size-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{document.source.fileName}</span> ·{" "}
              {document.source.detectedFormat} · {document.artifacts.length} artefato(s)
            </p>
          </div>
        </>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {document && document.diagnostics.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDiagnostics}
            aria-label={`${document.diagnostics.length} diagnóstico(s)`}
          >
            <TriangleAlert className="text-amber-500" />
            {document.diagnostics.length}
          </Button>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}

export default Navbar;
