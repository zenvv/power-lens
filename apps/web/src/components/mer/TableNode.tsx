import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, EyeOff, Sigma } from "lucide-react";
import { HANDLE_SLOT_COUNT, TABLE_HEADER_HEIGHT } from "@/lib/mer-layout";
import type { MerRfNodeData } from "@/lib/mer-layout";

export type MerRfNodeDataWithToggle = MerRfNodeData & { onToggle?: (tableName: string) => void };

type TableNodeProps = NodeProps & { data: MerRfNodeDataWithToggle };

// Um handle por slot em cada lado (HANDLE_SLOT_COUNT, ver mer-layout.ts),
// espaçados uniformemente ao longo da altura do nó.
const HANDLE_SLOT_OFFSETS = Array.from(
  { length: HANDLE_SLOT_COUNT },
  (_, slot) => `${((slot + 1) / (HANDLE_SLOT_COUNT + 1)) * 100}%`,
);

function TableNodeComponent({ id, data }: TableNodeProps) {
  const { table, expanded, onToggle } = data;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm">
      {HANDLE_SLOT_OFFSETS.map((top, slot) => (
        <Handle
          key={`target-${slot}`}
          id={`target-${slot}`}
          type="target"
          position={Position.Left}
          style={{ top }}
          className="!bg-muted-foreground"
        />
      ))}
      {HANDLE_SLOT_OFFSETS.map((top, slot) => (
        <Handle
          key={`source-${slot}`}
          id={`source-${slot}`}
          type="source"
          position={Position.Right}
          style={{ top }}
          className="!bg-muted-foreground"
        />
      ))}

      <button
        type="button"
        onClick={() => onToggle?.(id)}
        className="flex items-center gap-1.5 border-b border-border/70 bg-muted/40 px-2 text-left text-sm font-medium hover:bg-muted/70"
        style={{ height: TABLE_HEADER_HEIGHT }}
      >
        {expanded ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
        <span className="truncate">{table.name}</span>
        {table.isHidden && <EyeOff className="size-3 shrink-0 text-muted-foreground" />}
        <span className="ml-auto shrink-0 text-[10px] font-normal text-muted-foreground">
          {table.columns.length} col.
        </span>
      </button>

      {expanded && (
        <div className="flex-1 overflow-y-auto">
          {table.columns.map((column) => (
            <div
              key={column.name}
              className="flex items-center gap-1.5 border-b border-border/40 px-2 text-xs last:border-b-0"
              style={{ height: 22 }}
            >
              {column.isCalculated ? (
                <Sigma className="size-3 shrink-0 text-muted-foreground" />
              ) : (
                <span className="size-3 shrink-0" />
              )}
              <span className="truncate">{column.name}</span>
              <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{column.dataType}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
