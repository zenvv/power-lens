import type { ReactNode } from "react";

type FlowNodeInputsTreeProps = {
  data: unknown;
};

/**
 * Renderiza o `inputs` bruto de um bloco (JSON arbitrário da Workflow
 * Definition Language) como grupos e campos legíveis: cada objeto vira um
 * grupo com o nome da chave, cada valor primitivo vira um campo label +
 * texto não editável.
 */
export function FlowNodeInputsTree({ data }: FlowNodeInputsTreeProps) {
  if (data === null || typeof data !== "object") {
    return <Field label="Inputs" value={String(data)} />;
  }

  const entries = Array.isArray(data)
    ? data.map((item, i) => [`[${i}]`, item] as const)
    : Object.entries(data as Record<string, unknown>);

  if (entries.length === 0) {
    return <p className="text-muted-foreground">Objeto vazio.</p>;
  }

  return <div className="flex flex-col gap-3">{entries.map(([key, value]) => renderNode(value, key, key))}</div>;
}

function renderNode(value: unknown, label: string, keyPath: string): ReactNode {
  if (value === null || value === undefined) {
    return <Field key={keyPath} label={label} value="null" />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <Field key={keyPath} label={label} value="[]" />;
    return (
      <Group key={keyPath} label={label}>
        {value.map((item, i) => renderNode(item, `[${i}]`, `${keyPath}.${i}`))}
      </Group>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <Field key={keyPath} label={label} value="{}" />;
    return (
      <Group key={keyPath} label={label}>
        {entries.map(([k, v]) => renderNode(v, k, `${keyPath}.${k}`))}
      </Group>
    );
  }

  return <Field key={keyPath} label={label} value={String(value)} />;
}

function formatLabel(label: string): string {
  if (label.startsWith("[")) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h5 className="text-[11px] font-medium text-muted-foreground">{formatLabel(label)}:</h5>
      <div className="flex flex-col gap-2 border-l border-border pl-2.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[11px] text-muted-foreground">{formatLabel(label)}:</label>
      <div className="rounded-md border border-input bg-input/20 px-2 py-1 text-xs break-all whitespace-pre-wrap dark:bg-input/30">
        {value}
      </div>
    </div>
  );
}
