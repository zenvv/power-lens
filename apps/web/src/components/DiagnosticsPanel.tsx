import { useMemo, useState } from "react";
import type { Diagnostic } from "@power-lens/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type DiagnosticsPanelProps = {
  diagnostics: Diagnostic[];
};

const SEVERITY_VARIANT: Record<Diagnostic["severity"], "destructive" | "secondary" | "outline"> = {
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
  const [activeSeverities, setActiveSeverities] = useState<ReadonlySet<Diagnostic["severity"]>>(
    () => new Set(SEVERITIES),
  );

  const counts = useMemo(() => {
    const result: Record<Diagnostic["severity"], number> = { error: 0, warning: 0, info: 0 };
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
    <Card>
      <CardHeader>
        <CardTitle>Diagnósticos</CardTitle>
        <CardDescription>Problemas estruturais e de health check encontrados durante a análise.</CardDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          {SEVERITIES.map((severity) => (
            <button
              key={severity}
              type="button"
              onClick={() => toggleSeverity(severity)}
              className={cn(
                "transition-opacity",
                !activeSeverities.has(severity) && counts[severity] > 0 && "opacity-40",
              )}
            >
              <Badge variant={SEVERITY_VARIANT[severity]}>
                {severity} ({counts[severity]})
              </Badge>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum diagnóstico com a severidade selecionada.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((diagnostic, index) => (
              <li key={`${diagnostic.code}-${index}`}>
                <div className="flex items-center gap-2">
                  <Badge variant={SEVERITY_VARIANT[diagnostic.severity]}>{diagnostic.severity}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{diagnostic.code}</span>
                </div>
                <p className="mt-1 text-sm">{diagnostic.message}</p>
                {diagnostic.path && <p className="mt-0.5 text-xs text-muted-foreground">{diagnostic.path}</p>}
                {diagnostic.hint && <p className="mt-0.5 text-xs text-muted-foreground italic">{diagnostic.hint}</p>}
                {index < filtered.length - 1 && <Separator className="mt-3" />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
