import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ExternalLink, Languages, Monitor, Moon, Sun } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/locale";

const LOCALES: readonly Locale[] = ["en", "pt", "es"];

/** Versão compacta (só ícones) do rodapé de configurações da sidebar
 * (`SidebarFooter`), pra tela de upload — a única sem navegação lateral, e
 * portanto sem acesso a idioma/tema/link do projeto. Mesmas opções, sem o
 * botão de resetar dados (não há nada pra resetar em `idle`). */
export function SettingsCorner() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ThemeIcon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground")}
          aria-label={t.sidebarFooter.language}
          title={t.sidebarFooter.language}
        >
          <Languages className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground")}
          aria-label={t.sidebarFooter.theme}
          title={t.sidebarFooter.theme}
        >
          <ThemeIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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

      <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
        <a
          href="https://github.com/zenvv/power-lens"
          target="_blank"
          rel="noreferrer"
          aria-label={t.sidebarFooter.githubLink}
          title={t.sidebarFooter.githubLink}
        >
          <ExternalLink className="size-4" />
        </a>
      </Button>
    </div>
  );
}
