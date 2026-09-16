import { useState, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shortArtifactName } from "@/lib/artifact-name";

/** Card de uma categoria de artefato (fluxos, modelos, apps). Com um único
 * artefato, o título é texto simples; com mais de um, o título vira um
 * dropdown — trocar de artefato sem abas ocupando espaço horizontal. */
export function ArtifactTabs<T extends { id: string; name: string }>({
  items,
  description,
  contentClassName,
  children,
}: {
  items: T[];
  description: (item: T) => ReactNode;
  contentClassName?: string;
  children: (item: T) => ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(items[0]!.id);
  const selected = items.find((item) => item.id === selectedId) ?? items[0]!;

  return (
    <Card>
      <CardHeader>
        {items.length > 1 ? (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger
              className="h-auto w-fit max-w-full border-none bg-transparent p-0 font-heading text-sm font-medium shadow-none hover:bg-transparent"
              title={selected.name}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id} title={item.name}>
                  {shortArtifactName(item.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <CardTitle title={selected.name}>{shortArtifactName(selected.name)}</CardTitle>
        )}
        <CardDescription>{description(selected)}</CardDescription>
      </CardHeader>
      <CardContent className={contentClassName}>{children(selected)}</CardContent>
    </Card>
  );
}
