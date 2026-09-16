import { useEffect, useState } from "react";
import type { CanvasApp } from "@power-lens/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WireframeView } from "@/components/wireframe/WireframeView";
import { ScreenNavMap } from "./ScreenNavMap";
import { ControlReferencesPanel } from "./ControlReferencesPanel";
import { ComponentInventory } from "./ComponentInventory";
import { useI18n } from "@/lib/i18n/context";

type CanvasAppViewProps = {
  app: CanvasApp;
  /** Vindo da busca global (Fase 9) — quando presente, garante que a aba
   * "Wireframe" (a única que sabe usar isso) fica ativa, mesmo que o
   * usuário estivesse numa das outras três. */
  initialSelection?: { screenName: string; controlName?: string | undefined } | undefined;
};

/** Agrupa as 4 abas de um Canvas App (Wireframe + as 3 views novas da Fase
 * 11) — extraído como componente próprio (em vez de inline no
 * `DocumentView`) só pra poder ter estado de aba controlado, necessário
 * pra busca global conseguir saltar direto pro Wireframe. */
export function CanvasAppView({ app, initialSelection }: CanvasAppViewProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState("wireframe");

  useEffect(() => {
    if (initialSelection) setTab("wireframe");
  }, [initialSelection]);

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-3">
      <TabsList>
        <TabsTrigger value="wireframe">{t.documentView.appsTabs.wireframe}</TabsTrigger>
        <TabsTrigger value="navigation">{t.documentView.appsTabs.navigation}</TabsTrigger>
        <TabsTrigger value="references">{t.documentView.appsTabs.references}</TabsTrigger>
        <TabsTrigger value="components">{t.documentView.appsTabs.components}</TabsTrigger>
      </TabsList>
      <TabsContent value="wireframe">
        <WireframeView app={app} initialSelection={initialSelection} />
      </TabsContent>
      <TabsContent value="navigation">
        <ScreenNavMap app={app} />
      </TabsContent>
      <TabsContent value="references">
        <ControlReferencesPanel app={app} />
      </TabsContent>
      <TabsContent value="components">
        <ComponentInventory app={app} />
      </TabsContent>
    </Tabs>
  );
}
