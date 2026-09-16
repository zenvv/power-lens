import type { PowerLensDocument } from "@power-lens/core";
import {
  Download,
  FileText,
  Search,
  Sparkles,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { Button } from "../ui/button";
import { useI18n } from "@/lib/i18n/context";
import { FormatIcon } from "./FormatIcon";
import Logo from "./Logo";
import { SettingsCorner } from "./SettingsCorner";

type NavbarProps = {
  document?: PowerLensDocument | null;
  /** A navegação lateral não existe ainda na tela de upload — sem ela, o
   * botão de hambúrguer (só visível em mobile) não teria o que abrir. */
  showSidebarToggle: boolean;
  onOpenDiagnostics: () => void;
  onRequestImport: () => void;
  onDownloadMarkdown: () => void;
  onDownloadIr: () => void;
  onOpenAi: () => void;
  onOpenSearch: () => void;
};

/** Barra superior fixa do app. Identidade à esquerda, arquivo atual ao
 * centro (com o atalho pra trocar de arquivo, que passa por confirmação —
 * ver `App.tsx`) e ações rápidas à direita. */
function Navbar({
  document,
  showSidebarToggle,
  onOpenDiagnostics,
  onRequestImport,
  onDownloadMarkdown,
  onDownloadIr,
  onOpenAi,
  onOpenSearch,
}: NavbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex justify-start h-12 w-full shrink-0  items-center gap-1 bg-sidebar px-4">
      <div className="flex shrink-0 items-center gap-2 group transition-all select-none w-58">
        <Logo className="size-6 text-foreground group-hover:text-sidebar-primary transition-all" />

        <div className="flex flex-col leading-none">
          <span className="font-heading text-sm font-semibold group-hover:text-sidebar-primary group-hover:shimmer">
            Power Lens
          </span>
          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground">
            {t.navbar.notAffiliated}
          </span>
        </div>
      </div>
      <div className="flex-1 flex justify-start">
        {document && (
          <div className="w-full max-w-md m-0! h-10.5 rounded-lg bg-background/20 px-1 gap-2 flex items-center justify-start border text-xs border-border/30 hover:border-border hover:bg-background/40 transition-all">
            <div className="size-8 flex p-1 items-center justify-center bg-linear-to-t from-muted/50 to-transparent border rounded-md">
              <FormatIcon
                document={document}
                className="size-6 shrink-0 text-muted-foreground"
              />
            </div>
            <div className="min-w-0 flex-1 justify-center flex flex-col h-full">
              <span className="font-medium text-foreground w-full truncate leading-none">
                {document.source.fileName}
              </span>{" "}
              <span className="truncate text-[10px]line-clamp-1 text-muted-foreground leading-none">
                {document.source.detectedFormat} ·{" "}
                {t.navbar.artifactsCount({ count: document.artifacts.length })}
              </span>
            </div>
            <div>
              <Button variant="ghost" onClick={onRequestImport}>
                <UploadCloud /> {t.navbar.importFile}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1">
        {document && document.diagnostics.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDiagnostics}
            aria-label={t.navbar.diagnosticsAria({
              count: document.diagnostics.length,
            })}
          >
            <TriangleAlert className="text-amber-500" />
            {document.diagnostics.length}
          </Button>
        )}
        {document && (
          <>
            <Button variant="ghost" size="sm" onClick={onOpenSearch} aria-label={t.search.openButton}>
              <Search /> {t.search.openButton}
            </Button>
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
        {!showSidebarToggle && <SettingsCorner />}
      </div>
    </div>
  );
}

export default Navbar;
