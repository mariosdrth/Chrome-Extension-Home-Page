import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  publicDir: "public",
  plugins: [react()],
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
