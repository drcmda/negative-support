import { defineConfig } from "vite";
import { resolve } from "path";
import { readFileSync } from "fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";

const coreVersion = JSON.parse(readFileSync(resolve(__dirname, "../core/package.json"), "utf-8")).version;

export default defineConfig({
  define: {
    __CORE_VERSION__: JSON.stringify(coreVersion),
  },
  plugins: [tailwindcss(), react(), wasm()],
  resolve: {
    alias: {
      "@core": resolve(__dirname, "../core/src"),
      "occt-import-js": resolve(__dirname, "node_modules/occt-import-js"),
      "manifold-3d": resolve(__dirname, "node_modules/manifold-3d"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});
