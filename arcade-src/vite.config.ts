import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: "/arcade/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    exclude: ["@dimforge/rapier3d-compat"],
  },
  build: {
    outDir: path.resolve(__dirname, "../arcade"),
    emptyOutDir: true,
  },
});
