import { useMemo, useState } from "react";
import { resolveScreenLayout, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, type CanvasApp } from "@power-lens/core";
import { Button } from "@/components/ui/button";
import { ControlBox } from "./ControlBox";

type WireframeViewProps = {
  app: CanvasApp;
};

/**
 * Renderização estática por tela (spec seção 7) — nunca chamar de "preview"
 * na UI, é um blueprint aproximado, não uma simulação fiel do app rodando.
 */
export function WireframeView({ app }: WireframeViewProps) {
  const sortedScreens = useMemo(() => [...app.screens].sort((a, b) => a.order - b.order), [app.screens]);
  const [selectedName, setSelectedName] = useState<string | undefined>(sortedScreens[0]?.name);
  const selectedScreen = sortedScreens.find((s) => s.name === selectedName) ?? sortedScreens[0];

  const resolved = useMemo(() => (selectedScreen ? resolveScreenLayout(selectedScreen) : undefined), [selectedScreen]);

  if (!selectedScreen || !resolved) {
    return <p className="text-sm text-muted-foreground">Nenhuma tela pra mostrar.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {sortedScreens.map((screen) => (
          <Button
            key={screen.name}
            size="sm"
            variant={screen.name === selectedScreen.name ? "default" : "outline"}
            onClick={() => setSelectedName(screen.name)}
          >
            {screen.name}
          </Button>
        ))}
      </div>

      <div className="overflow-auto rounded-lg border bg-muted/20 p-6">
        <div
          className="relative mx-auto flex flex-col rounded-sm border bg-background p-1 shadow-sm"
          style={{
            width: DEFAULT_CANVAS_WIDTH,
            height: DEFAULT_CANVAS_HEIGHT,
            background: resolved.fill.status === "resolved" ? resolved.fill.value : undefined,
          }}
        >
          {resolved.children.map((child) => (
            <ControlBox key={child.name} control={child} />
          ))}
        </div>
      </div>
    </div>
  );
}
