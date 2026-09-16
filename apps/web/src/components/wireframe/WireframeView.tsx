import { useEffect, useMemo, useRef, useState } from "react";
import { resolveScreenLayout, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, type CanvasApp } from "@power-lens/core";
import { CanvasTreeView } from "./CanvasTreeView";
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
  const [selectedControlName, setSelectedControlName] = useState<string>();
  const selectedScreen = sortedScreens.find((s) => s.name === selectedName) ?? sortedScreens[0];
  const canvasRef = useRef<HTMLDivElement>(null);

  const resolved = useMemo(() => (selectedScreen ? resolveScreenLayout(selectedScreen) : undefined), [selectedScreen]);

  // Rola o controle selecionado na tree view pra dentro da área visível do
  // canvas — sem isso, escolher um controle aninhado fundo numa tela maior
  // que o viewport do canvas exigiria procurar a caixa manualmente.
  useEffect(() => {
    if (!selectedControlName || !canvasRef.current) return;
    const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(selectedControlName) : selectedControlName;
    const target = canvasRef.current.querySelector(`[data-control-name="${escaped}"]`);
    target?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  }, [selectedControlName, selectedScreen?.name]);

  if (!selectedScreen || !resolved) {
    return <p className="text-sm text-muted-foreground">Nenhuma tela pra mostrar.</p>;
  }

  return (
    <div className="flex gap-3">
      <CanvasTreeView
        screens={sortedScreens}
        selectedScreenName={selectedScreen.name}
        onSelectScreen={(name) => {
          setSelectedName(name);
          setSelectedControlName(undefined);
        }}
        selectedControlName={selectedControlName}
        onSelectControl={setSelectedControlName}
      />

      <div ref={canvasRef} className="min-w-0 flex-1 overflow-auto rounded-lg border bg-muted/20 p-6">
        <div
          className="relative mx-auto flex flex-col rounded-sm border bg-background p-1 shadow-sm"
          style={{
            width: DEFAULT_CANVAS_WIDTH,
            height: DEFAULT_CANVAS_HEIGHT,
            background: resolved.fill.status === "resolved" ? resolved.fill.value : undefined,
          }}
        >
          {resolved.children.map((child, index) => (
            <ControlBox
              key={child.name}
              control={child}
              siblingIndex={index}
              selectedControlName={selectedControlName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
