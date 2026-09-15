import { useCallback, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

/** Alvo central de import — sem borda de nenhum tipo (o convite é o próprio
 * ícone + texto flutuando no meio do OrbitField, não uma caixa). O feedback
 * de "solte aqui" é um halo suave que aparece atrás do ícone, não uma borda
 * mudando de cor. */
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
      aria-label="Solte um arquivo ou clique para escolher"
      className={cn(
        "relative z-10 flex flex-col items-center gap-3 rounded-2xl px-8 py-6 text-center outline-none",
        disabled ? "cursor-wait" : "cursor-pointer",
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

      <div className="relative flex size-16 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/25 blur-md"
          animate={
            isDragging
              ? { scale: 1.35, opacity: 0.7 }
              : { scale: [1, 1.16, 1], opacity: [0.28, 0, 0.28] }
          }
          transition={
            isDragging
              ? { duration: 0.2 }
              : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <FileText className="relative size-8 text-foreground/70" strokeWidth={1.5} />
      </div>

      <p className="max-w-56 text-sm text-muted-foreground">
        {disabled
          ? "Recebendo o arquivo..."
          : "Solte um .msapp, solution .zip, .pbit ou .pbip aqui, ou clique para escolher"}
      </p>
    </div>
  );
}
