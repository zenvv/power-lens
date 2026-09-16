import { useState } from "react";
import type { Control, Screen } from "@power-lens/core";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CanvasTreeViewProps = {
  screens: readonly Screen[];
  selectedScreenName: string | undefined;
  onSelectScreen: (name: string) => void;
  selectedControlName: string | undefined;
  onSelectControl: (name: string) => void;
};

/**
 * Tree view lateral inspirada na do Power Apps Studio: uma tela por item de
 * topo, um subitem recursivo por controle. Só navegação — não edita nada.
 * Construída a partir do `Control` cru (não do `ResolvedControl`): a árvore
 * só precisa de nome/tipo/filhos, então não faz sentido pagar o custo (nem
 * a complexidade) de resolver layout de todas as telas só pra listar os
 * nomes de uma sidebar.
 */
export function CanvasTreeView({
  screens,
  selectedScreenName,
  onSelectScreen,
  selectedControlName,
  onSelectControl,
}: CanvasTreeViewProps) {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-0.5 overflow-auto rounded-lg border bg-muted/10 p-2 text-sm">
      <p className="px-1 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Screens</p>
      {screens.map((screen) => (
        <ScreenNode
          key={screen.name}
          screen={screen}
          isSelected={screen.name === selectedScreenName}
          onSelectScreen={onSelectScreen}
          selectedControlName={selectedControlName}
          onSelectControl={onSelectControl}
        />
      ))}
    </div>
  );
}

function TreeRow({
  label,
  detail,
  depth,
  isSelected,
  isExpandable,
  isExpanded,
  onToggleExpand,
  onSelect,
}: {
  label: string;
  detail?: string;
  depth: number;
  isSelected: boolean;
  isExpandable: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ paddingLeft: 4 + depth * 14 }}
      className={cn(
        "flex w-full items-center gap-1 rounded px-1 py-1 text-left hover:bg-muted",
        isSelected && "bg-accent text-accent-foreground",
      )}
    >
      {isExpandable ? (
        <span
          role="button"
          tabIndex={-1}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
          className="shrink-0 text-muted-foreground"
        >
          {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </span>
      ) : (
        <span className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{label}</span>
      {detail && <span className="ml-auto shrink-0 truncate pl-2 text-[10px] text-muted-foreground">{detail}</span>}
    </button>
  );
}

function ScreenNode({
  screen,
  isSelected,
  onSelectScreen,
  selectedControlName,
  onSelectControl,
}: {
  screen: Screen;
  isSelected: boolean;
  onSelectScreen: (name: string) => void;
  selectedControlName: string | undefined;
  onSelectControl: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(isSelected);
  const showChildren = expanded || isSelected;

  return (
    <div>
      <TreeRow
        label={screen.name}
        depth={0}
        isSelected={isSelected && !selectedControlName}
        isExpandable={screen.root.children.length > 0}
        isExpanded={showChildren}
        onToggleExpand={() => setExpanded((v) => !v)}
        onSelect={() => {
          onSelectScreen(screen.name);
          setExpanded(true);
        }}
      />
      {showChildren &&
        screen.root.children.map((child) => (
          <ControlNode
            key={child.name}
            control={child}
            depth={1}
            selectedControlName={selectedControlName}
            onSelectControl={onSelectControl}
          />
        ))}
    </div>
  );
}

function ControlNode({
  control,
  depth,
  selectedControlName,
  onSelectControl,
}: {
  control: Control;
  depth: number;
  selectedControlName: string | undefined;
  onSelectControl: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = control.children.length > 0;

  return (
    <div>
      <TreeRow
        label={control.name}
        detail={control.type}
        depth={depth}
        isSelected={control.name === selectedControlName}
        isExpandable={hasChildren}
        isExpanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        onSelect={() => onSelectControl(control.name)}
      />
      {expanded &&
        control.children.map((child) => (
          <ControlNode
            key={child.name}
            control={child}
            depth={depth + 1}
            selectedControlName={selectedControlName}
            onSelectControl={onSelectControl}
          />
        ))}
    </div>
  );
}
