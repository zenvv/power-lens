import type { ComponentType } from "react";
import type { PowerLensDocument } from "@power-lens/core";
import { motion } from "motion/react";
import {
  AppWindow,
  Database,
  FileText,
  LayoutDashboard,
  Sparkles,
  TriangleAlert,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { groupArtifactsByKind } from "@/lib/artifact-groups";
import { cn } from "@/lib/utils";

export type SectionId =
  | "home"
  | "summary"
  | "flows"
  | "models"
  | "apps"
  | "diagnostics"
  | "docs"
  | "ai";

type SidebarProps = {
  document: PowerLensDocument | null;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  onRequestImport: () => void;
  /** Controla o drawer em telas estreitas; em `md:` pra cima o rail fica
   * sempre visível e essas props não têm efeito. */
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function NavItem({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string | undefined }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <Badge variant={active ? "default" : "secondary"} className="tabular-nums">
          {count}
        </Badge>
      )}
    </button>
  );
}

function NavGroupLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[11px] font-medium tracking-wide text-sidebar-foreground/45 uppercase first:pt-1">
      {children}
    </p>
  );
}

/** Navegação lateral persistente do app (inspirada no rail com grupos do
 * Power Platform admin center). Só some na tela de upload em si (nenhum
 * arquivo em andamento) — o pai (App.tsx) desmonta este componente nesse
 * momento; a partir daí ("Importar arquivo" já em andamento, erro, ou
 * documento carregado) ela fica montada e entra com slide-in + fade.
 * Trocar de arquivo com uma análise já carregada passa por confirmação
 * (`onRequestImport`); sem documento carregado, o item só reflete que já
 * estamos na seção certa. */
export function Sidebar({
  document,
  activeSection,
  onSectionChange,
  onRequestImport,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { flows, models, canvasApps } = document
    ? groupArtifactsByKind(document)
    : { flows: [], models: [], canvasApps: [] };

  function go(section: SectionId) {
    onSectionChange(section);
    onMobileClose();
  }

  function requestImport() {
    onRequestImport();
    onMobileClose();
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar navegação"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <motion.nav
        initial={{ opacity: 0, marginLeft: -28 }}
        animate={{ opacity: 1, marginLeft: 0 }}
        exit={{ opacity: 0, marginLeft: -16 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className={cn(
          "fixed top-12 bottom-0 left-0 z-50 flex w-64 -translate-x-full flex-col gap-0.5 overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 py-4 transition-transform duration-200 md:static md:top-auto md:bottom-auto md:z-auto md:w-60 md:shrink-0 md:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        <NavItem
          active={!document}
          onClick={document ? requestImport : () => go("home")}
          icon={UploadCloud}
          label="Importar arquivo"
        />

        {document && (
          <>
            <NavGroupLabel>Análise</NavGroupLabel>
            <NavItem
              active={activeSection === "summary"}
              onClick={() => go("summary")}
              icon={LayoutDashboard}
              label="Resumo"
            />
            {flows.length > 0 && (
              <NavItem
                active={activeSection === "flows"}
                onClick={() => go("flows")}
                icon={Workflow}
                label="Fluxos"
                count={flows.length}
              />
            )}
            {models.length > 0 && (
              <NavItem
                active={activeSection === "models"}
                onClick={() => go("models")}
                icon={Database}
                label="Modelos de dados"
                count={models.length}
              />
            )}
            {canvasApps.length > 0 && (
              <NavItem
                active={activeSection === "apps"}
                onClick={() => go("apps")}
                icon={AppWindow}
                label="Apps"
                count={canvasApps.length}
              />
            )}
            {document.diagnostics.length > 0 && (
              <NavItem
                active={activeSection === "diagnostics"}
                onClick={() => go("diagnostics")}
                icon={TriangleAlert}
                label="Diagnósticos"
                count={document.diagnostics.length}
              />
            )}

            <NavGroupLabel>Saída</NavGroupLabel>
            <NavItem
              active={activeSection === "docs"}
              onClick={() => go("docs")}
              icon={FileText}
              label="Documentação"
            />
            <NavItem
              active={activeSection === "ai"}
              onClick={() => go("ai")}
              icon={Sparkles}
              label="Explicação por IA"
            />
          </>
        )}
      </motion.nav>
    </>
  );
}
