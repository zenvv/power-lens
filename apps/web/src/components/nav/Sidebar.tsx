import { useEffect, useState, type ComponentType } from "react";
import type { PowerLensDocument, RuleConfigMap } from "@power-lens/core";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import {
  AppWindow,
  Database,
  ExternalLink,
  FileText,
  Languages,
  LayoutDashboard,
  Monitor,
  Moon,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RuleConfigDialog } from "@/components/rules/RuleConfigDialog";
import { groupArtifactsByKind } from "@/lib/artifact-groups";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/locale";

export type SectionId =
  | "home"
  | "summary"
  | "flows"
  | "models"
  | "apps"
  | "dependencies"
  | "diagnostics"
  | "docs"
  | "ai";

type SidebarProps = {
  document: PowerLensDocument | null;
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  /** Abre a confirmação de "importar outro arquivo" — hoje só a navbar tem UI
   * pra isso; o rodapé de configurações (ver changelog) vai reusar o mesmo
   * callback pro botão de resetar/limpar dados. */
  onRequestImport: () => void;
  /** Controla o drawer em telas estreitas; em `md:` pra cima o rail fica
   * sempre visível e essas props não têm efeito. */
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** Repassa a config salva no `RuleConfigDialog` pro `App.tsx` re-rodar a
   * análise (Fase 8 do plano de novas features) — `undefined` quando o
   * usuário restaura pro padrão. */
  onRuleConfigChange: (config: RuleConfigMap | undefined) => void;
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
          ? "bg-linear-to-t from-sidebar-primary/10 to-sidebar-primary/5 text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <Badge
          variant={active ? "default" : "secondary"}
          className="tabular-nums"
        >
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

const LOCALES: readonly Locale[] = ["en", "pt", "es"];
const LOCALE_CODE: Record<Locale, string> = { en: "EN", pt: "PT", es: "ES" };

/** Rodapé de configurações da sidebar — resetar/limpar dados, idioma, tema e
 * um link de créditos, nesta ordem (pedido do usuário). Fica fora do bloco
 * `{document && (...)}` de cima porque essas quatro configurações fazem
 * sentido mesmo em `loading`/`unrecognized`, não só com um documento já
 * carregado — só o botão de resetar dados é desabilitado nesse caso. */
function SidebarFooter({
  hasDocument,
  onRequestReset,
  onRuleConfigChange,
}: {
  hasDocument: boolean;
  onRequestReset: () => void;
  onRuleConfigChange: (config: RuleConfigMap | undefined) => void;
}) {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ThemeIcon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="mt-auto flex flex-col gap-0.5 pt-2">
      <Separator className="mb-1 bg-sidebar-border" />

      <Button
        variant="ghost"
        className="w-full justify-start gap-2.5 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        disabled={!hasDocument}
        onClick={onRequestReset}
      >
        <Trash2 className="size-4 shrink-0" />
        {t.sidebarFooter.resetData}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-start gap-2.5 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground",
          )}
        >
          <Languages className="size-4 shrink-0" />
          <span className="flex-1 text-left">{t.sidebarFooter.language}</span>
          <span className="text-xs text-sidebar-foreground/50">{LOCALE_CODE[locale]}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t.sidebarFooter.language}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            {LOCALES.map((candidate) => (
              <DropdownMenuRadioItem key={candidate} value={candidate}>
                {t.sidebarFooter.languageNames[candidate]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-start gap-2.5 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground",
          )}
        >
          <ThemeIcon className="size-4 shrink-0" />
          <span className="flex-1 text-left">{t.sidebarFooter.theme}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t.sidebarFooter.theme}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun className="size-4 shrink-0" /> {t.sidebarFooter.themeLight}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="size-4 shrink-0" /> {t.sidebarFooter.themeDark}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="size-4 shrink-0" /> {t.sidebarFooter.themeSystem}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <RuleConfigDialog
        onConfigChange={onRuleConfigChange}
        trigger={
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <SlidersHorizontal className="size-4 shrink-0" />
            {t.sidebarFooter.rules}
          </Button>
        }
      />

      <Button variant="ghost" className="w-full justify-start gap-2.5 px-3 text-sidebar-foreground/70 hover:text-sidebar-foreground" asChild>
        <a href="https://github.com/zenvv/power-lens" target="_blank" rel="noreferrer">
          <ExternalLink className="size-4 shrink-0" />
          {t.sidebarFooter.githubLink}
        </a>
      </Button>
    </div>
  );
}

/** Navegação lateral persistente do app (inspirada no rail com grupos do
 * Power Platform admin center). Só some na tela de upload em si (nenhum
 * arquivo em andamento) — o pai (App.tsx) desmonta este componente nesse
 * momento; a partir daí (documento em análise, erro, ou carregado) ela fica
 * montada e entra com slide-in + fade. "Importar arquivo" mora na navbar
 * (grupo central), não aqui — ver `Navbar.tsx`; o rodapé (`SidebarFooter`)
 * reusa o mesmo `onRequestImport` pro botão de resetar/limpar dados, já que
 * o efeito é idêntico (descarta a análise atual, volta pra tela de
 * importação). */
export function Sidebar({
  document,
  activeSection,
  onSectionChange,
  onRequestImport,
  mobileOpen,
  onMobileClose,
  onRuleConfigChange,
}: SidebarProps) {
  const { t } = useI18n();
  const { flows, models, canvasApps } = document
    ? groupArtifactsByKind(document)
    : { flows: [], models: [], canvasApps: [] };

  function go(section: SectionId) {
    onSectionChange(section);
    onMobileClose();
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label={t.nav.closeNav}
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
          "fixed top-12 bottom-0 left-0 z-50 flex w-64 -translate-x-full flex-col gap-0.5 overflow-y-auto bg-sidebar px-3 py-4 transition-transform duration-200 md:static md:top-auto md:bottom-auto md:z-auto md:w-60 md:shrink-0 md:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        {document && (
          <>
            <NavGroupLabel>{t.nav.groupAnalysis}</NavGroupLabel>
            <NavItem
              active={activeSection === "summary"}
              onClick={() => go("summary")}
              icon={LayoutDashboard}
              label={t.nav.summary}
            />
            {flows.length > 0 && (
              <NavItem
                active={activeSection === "flows"}
                onClick={() => go("flows")}
                icon={Workflow}
                label={t.nav.flows}
                count={flows.length}
              />
            )}
            {models.length > 0 && (
              <NavItem
                active={activeSection === "models"}
                onClick={() => go("models")}
                icon={Database}
                label={t.nav.models}
                count={models.length}
              />
            )}
            {canvasApps.length > 0 && (
              <NavItem
                active={activeSection === "apps"}
                onClick={() => go("apps")}
                icon={AppWindow}
                label={t.nav.apps}
                count={canvasApps.length}
              />
            )}
            {document.dependencies.length > 0 && (
              <NavItem
                active={activeSection === "dependencies"}
                onClick={() => go("dependencies")}
                icon={Share2}
                label={t.nav.dependencies}
                count={document.dependencies.length}
              />
            )}
            {document.diagnostics.length > 0 && (
              <NavItem
                active={activeSection === "diagnostics"}
                onClick={() => go("diagnostics")}
                icon={TriangleAlert}
                label={t.nav.diagnostics}
                count={document.diagnostics.length}
              />
            )}

            <NavGroupLabel>{t.nav.groupOutput}</NavGroupLabel>
            <NavItem
              active={activeSection === "docs"}
              onClick={() => go("docs")}
              icon={FileText}
              label={t.nav.docs}
            />
            <NavItem
              active={activeSection === "ai"}
              onClick={() => go("ai")}
              icon={Sparkles}
              label={t.nav.ai}
            />
          </>
        )}

        <SidebarFooter
          hasDocument={document !== null}
          onRequestReset={onRequestImport}
          onRuleConfigChange={onRuleConfigChange}
        />
      </motion.nav>
    </>
  );
}
