import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function Dropzone({ onFile, disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) onFile(file);
      event.target.value = "";
    },
    [onFile],
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      className={cn(
        "flex w-[min(480px,90vw)] flex-col items-center gap-3 rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        disabled ? "cursor-wait opacity-60" : "cursor-pointer hover:border-primary/60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".msapp,.zip,.pbit,.pbip,.pbix,.json"
        onChange={onInputChange}
        className="hidden"
        disabled={disabled}
      />
      <UploadCloud className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {disabled
          ? "Analisando..."
          : "Solte um arquivo .msapp, solution .zip, .pbit ou .pbip aqui, ou clique para escolher"}
      </p>
    </div>
  );
}
