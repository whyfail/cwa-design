import { createRequire } from "node:module";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { siteDataPlugin } from "./scripts/site-data.mjs";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [react(), siteDataPlugin()],
  ssr: {
    external: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/server",
    ],
    noExternal: ["@base-ui/react", "motion", "framer-motion"],
  },
  resolve: {
    alias: [
      {
        find: /^@cwa-design\/react$/,
        replacement: path.resolve(import.meta.dirname, "../../packages/react/dist/index.js"),
      },
      { find: /^react$/, replacement: require.resolve("react") },
      { find: /^react\/jsx-runtime$/, replacement: require.resolve("react/jsx-runtime") },
      { find: /^react\/jsx-dev-runtime$/, replacement: require.resolve("react/jsx-dev-runtime") },
    ],
  },
  define: {
    __CWA_RELEASE__: JSON.stringify({ version: "development", commit: "local", channel: "source" }),
  },
});
