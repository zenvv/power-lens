import { useCallback, useState } from "react";

export function App() {
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    // Parsing pipeline (detector -> parsers -> IR) is not implemented yet.
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        fontFamily: "system-ui, sans-serif",
        background: "#0f0f10",
        color: "#e6e6e6",
      }}
    >
      <h1 style={{ margin: 0 }}>Power Lens</h1>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          width: "min(480px, 90vw)",
          padding: "3rem 2rem",
          border: `2px dashed ${isDragging ? "#7dd3fc" : "#3a3a3d"}`,
          borderRadius: "12px",
          textAlign: "center",
          transition: "border-color 120ms ease",
        }}
      >
        Solte um arquivo .msapp, solution .zip, .pbit ou .pbip aqui
      </div>
    </main>
  );
}
