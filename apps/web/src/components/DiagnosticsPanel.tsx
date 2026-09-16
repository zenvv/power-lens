import { useMemo, useState } from "react";
import type { Diagnostic } from "@power-lens/core";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { SectionHeader } from "./document/SectionHeader";
import { Button } from "./ui/button";

type DiagnosticsPanelProps = {
  diagnostics: Diagnostic[];
};

const SEVERITY_VARIANT: Record<
  Diagnostic["severity"],
  "destructive" | "secondary" | "outline"
> = {
  error: "destructive",
  warning: "secondary",
  info: "outline",
};

const SEVERITIES: Diagnostic["severity"][] = ["error", "warning", "info"];

/** Painel de diagnósticos com filtro por severidade (spec seção 7: "painel
 * de diagnósticos, filtro por severidade") — mistura diagnósticos de parsing
 * com os de health check (PL001+), sem distinguir a origem na UI: pro
 * usuário ambos são só "coisas que a análise encontrou". */
export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  const { t } = useI18n();
  const [activeSeverities, setActiveSeverities] = useState<
    ReadonlySet<Diagnostic["severity"]>
  >(() => new Set(SEVERITIES));

  const counts = useMemo(() => {
    const result: Record<Diagnostic["severity"], number> = {
      error: 0,
      warning: 0,
      info: 0,
    };
    for (const d of diagnostics) result[d.severity]++;
    return result;
  }, [diagnostics]);

  const filtered = useMemo(
    () => diagnostics.filter((d) => activeSeverities.has(d.severity)),
    [diagnostics, activeSeverities],
  );

  function toggleSeverity(severity: Diagnostic["severity"]) {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  }

  if (diagnostics.length === 0) return null;

  return (
    <div>
      <div>
        <SectionHeader
          title={t.diagnosticsPanel.title}
          description={t.diagnosticsPanel.description}
        />

        <div className="flex flex-wrap gap-2 py-4 border-b">
          {SEVERITIES.map((severity) => (
            <Button
              variant={SEVERITY_VARIANT[severity]}
              key={severity}
              type="button"
              onClick={() => toggleSeverity(severity)}
              className={cn(
                "transition-opacity",
                !activeSeverities.has(severity) &&
                  counts[severity] > 0 &&
                  "opacity-40",
              )}
            >
              {t.diagnosticsPanel.severityLabel[severity]} ({counts[severity]})
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.diagnosticsPanel.emptyFiltered}
          </p>
        ) : (
          <ul className="flex flex-col gap-0">
            {filtered.map((diagnostic, index) => (
              <li
                key={`${diagnostic.code}-${index}`}
                className="hover:bg-muted/50 rounded-lg transition-all p-4"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={SEVERITY_VARIANT[diagnostic.severity]}>
                    {t.diagnosticsPanel.severityLabel[diagnostic.severity]}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {diagnostic.code}
                  </span>
                  <p className="ml-2 text-sm">{diagnostic.message}</p>
                  {diagnostic.path && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {diagnostic.path}
                    </p>
                  )}
                </div>

                {diagnostic.hint && (
                  <p className="mt-0.5 text-xs text-muted-foreground italic">
                    {diagnostic.hint}
                  </p>
                )}
                {/* {index < filtered.length - 1 && <Separator className="mt-3" />} */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
