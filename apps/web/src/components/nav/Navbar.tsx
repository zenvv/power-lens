import type { PowerLensDocument } from "@power-lens/core";
import { SearchSparkleColor } from "@fluentui/react-icons";
import { Download, FileText, Menu, Sparkles, TriangleAlert, UploadCloud } from "lucide-react";
import { Button } from "../ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText } from "../ui/input-group";
import { useI18n } from "@/lib/i18n/context";
import { FormatIcon } from "./FormatIcon";

type NavbarProps = {
  document?: PowerLensDocument | null;
  /** A navegação lateral não existe ainda na tela de upload — sem ela, o
   * botão de hambúrguer (só visível em mobile) não teria o que abrir. */
  showSidebarToggle: boolean;
  onOpenDiagnostics: () => void;
  onToggleSidebar: () => void;
  onRequestImport: () => void;
  onDownloadMarkdown: () => void;
  onDownloadIr: () => void;
  onOpenAi: () => void;
};

/** Barra superior fixa do app. Identidade à esquerda, arquivo atual ao
 * centro (com o atalho pra trocar de arquivo, que passa por confirmação —
 * ver `App.tsx`) e ações rápidas à direita. */
function Navbar({
  document,
  showSidebarToggle,
  onOpenDiagnostics,
  onToggleSidebar,
  onRequestImport,
  onDownloadMarkdown,
  onDownloadIr,
  onOpenAi,
}: NavbarProps) {
  const { t } = useI18n();

  return (
    <div className="grid h-12 w-full shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 bg-sidebar px-4">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t.navbar.openNav}
            onClick={onToggleSidebar}
          >
            <Menu />
          </Button>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <SearchSparkleColor className="size-5" />
          <div className="flex flex-col leading-none">
            <span className="font-heading text-sm font-semibold">Power Lens</span>
            <span className="text-[10px] text-muted-foreground/70">{t.navbar.notAffiliated}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        {document && (
          <InputGroup className="w-full max-w-md">
            <InputGroupAddon>
              <FormatIcon document={document} className="size-4 shrink-0 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupText className="min-w-0 flex-1 justify-start">
              <span className="truncate">
                <span className="font-medium text-foreground">{document.source.fileName}</span> ·{" "}
                {document.source.detectedFormat} · {t.navbar.artifactsCount({ count: document.artifacts.length })}
              </span>
            </InputGroupText>
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={onRequestImport}>
                <UploadCloud /> {t.navbar.importFile}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1">
        {document && document.diagnostics.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDiagnostics}
            aria-label={t.navbar.diagnosticsAria({ count: document.diagnostics.length })}
          >
            <TriangleAlert className="text-amber-500" />
            {document.diagnostics.length}
          </Button>
        )}
        {document && (
          <>
            <Button variant="ghost" size="sm" onClick={onDownloadMarkdown}>
              <FileText /> {t.navbar.downloadDoc}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDownloadIr}>
              <Download /> {t.navbar.downloadIr}
            </Button>
            <Button variant="default" size="sm" onClick={onOpenAi}>
              <Sparkles /> {t.navbar.openAi}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;
