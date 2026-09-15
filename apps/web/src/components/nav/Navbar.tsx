import type { PowerLensDocument } from "@power-lens/core";
import { Button } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";

type NavbarProps = {
  document?: PowerLensDocument | null;
  onReset: () => void;
};

function Navbar({ document, onReset }: NavbarProps) {
  return (
    <div className="sticky top-0 z-100 h-16 w-full border-b bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-6">
        <span className="font-heading text-lg font-semibold">Power Lens</span>

        {document && (
          <>
            <span className="h-5 w-px bg-border" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{document.source.fileName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {document.source.detectedFormat} · {document.artifacts.length} artefato(s) ·{" "}
                {document.diagnostics.length} diagnóstico(s)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onReset}>
              Analisar outro arquivo
            </Button>
          </>
        )}

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
