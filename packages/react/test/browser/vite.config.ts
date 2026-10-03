import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: false,
  server: { fs: { allow: [fileURLToPath(new URL("../../../..", import.meta.url))] } },
});
