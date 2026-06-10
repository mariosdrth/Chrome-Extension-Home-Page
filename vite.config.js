import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  publicDir: "public",
  plugins: [react()],
  server: {
    open: "/newtab.html",
  },
  build: {
    outDir: "dist/unpacked",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: path.resolve(__dirname, "newtab.html"),
      },
    },
  },
});
