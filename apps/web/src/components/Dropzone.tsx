import { useCallback, useRef, useState } from "react";

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
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      style={{
        width: "min(480px, 90vw)",
        padding: "3rem 2rem",
        border: `2px dashed ${isDragging ? "#7dd3fc" : "#3a3a3d"}`,
        borderRadius: "12px",
        textAlign: "center",
        transition: "border-color 120ms ease",
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".msapp,.zip,.pbit,.pbip,.pbix,.json"
        onChange={onInputChange}
        style={{ display: "none" }}
        disabled={disabled}
      />
      {disabled ? "Analisando..." : "Solte um arquivo .msapp, solution .zip, .pbit ou .pbip aqui, ou clique para escolher"}
    </div>
  );
}
