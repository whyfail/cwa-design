import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: new URL("./src/index.ts", import.meta.url).pathname,
      formats: ["es"],
    },
    rolldownOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        preserveModules: true,
        entryFileNames: "[name].js",
      },
    },
  },
});
