import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shortArtifactName } from "@/lib/artifact-name";

/** Sub-navegação de uma categoria de artefato (fluxos, modelos, apps). Com
 * um único artefato mostra o conteúdo direto; com mais de um, ganha abas —
 * "quase uma subguia" dentro da seção, não mais uma guia solta misturada
 * com as gerais. */
export function ArtifactTabs<T extends { id: string; name: string }>({
  items,
  children,
}: {
  items: T[];
  children: (item: T) => ReactNode;
}) {
  if (items.length === 1) return <>{children(items[0]!)}</>;

  return (
    <Tabs defaultValue={items[0]!.id} className="gap-4">
      <div className="overflow-x-auto">
        <TabsList variant={"line"} className="w-max">
          {items.map((item) => (
            <TabsTrigger key={item.id} value={item.id} title={item.name}>
              <span className="max-w-48 truncate">{shortArtifactName(item.name)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {items.map((item) => (
        <TabsContent key={item.id} value={item.id}>
          {children(item)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
