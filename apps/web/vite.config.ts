import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Assets estáticos compartilhados do monorepo (logo, imagens de
  // ilustração) moram em `public/` na raiz do repo, não dentro de
  // `apps/web` — só este app os serve, mas o local é compartilhado por
  // convenção (ver commit inicial do repo).
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
