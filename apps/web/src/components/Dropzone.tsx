import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

type DropzoneProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

/** Segmento B do `IntakeDiagram` — sem borda de nenhum tipo (o convite é o
 * próprio ícone + texto flutuando no meio do diagrama, não uma caixa). O
 * feedback de "solte aqui" é um halo suave atrás do ícone, e a própria
 * ilustração satura de cinza pra cor ao passar o mouse ou soltar o arquivo. */
export function Dropzone({ onFile, disabled }: DropzoneProps) {
  const { t } = useI18n();
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
      aria-label={t.dropzone.ariaLabel}
      className={cn(
        "relative z-10 flex flex-col items-center gap-2 rounded-2xl px-4 py-4 text-center outline-none sm:gap-3 sm:px-8 sm:py-6 group m-0! bg-radial from-transparent to-transparent hover:from-primary/3",
        disabled ? "cursor-wait" : "cursor-pointer",
      )}
    >
      <div className="absolute size-full rounded-full bg-background blur-xl inset-0 -z-10"></div>
      <input
        ref={inputRef}
        type="file"
        accept=".msapp,.zip,.pbit,.pbip,.pbix,.json"
        onChange={onInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="relative flex p-2 items-center justify-center  border rounded-xl bg-linear-to-t from-muted to-muted/20 outline outline-border outline-offset-2 group-hover:p-3 group-hover:-outline-offset-4 transition-all group-hover:from-card group-hover:to-card">
        {isDragging && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30 blur-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 1.3 }}
            transition={{ duration: 0.2 }}
          />
        )}

        <img
          src="/images/files.webp"
          alt=""
          className={cn(
            "relative size-20  object-contain saturate-0 transition-all duration-200",
            "group-hover:saturate-100 group-active:saturate-100 group-hover:scale-110",
            isDragging && "saturate-100",
          )}
        />
      </div>

      <p className="max-w-28 text-xs text-muted-foreground sm:max-w-56 sm:text-sm group-hover:text-foreground transition-all">
        {disabled ? t.dropzone.receiving : t.dropzone.hint}
      </p>
    </div>
  );
}
