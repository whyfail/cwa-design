import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 库构建（Vite 8 / Rolldown）：
// - lib 模式保证入口导出签名；preserveModules 保持模块边界；声明由 tsc 单独产出。
// - external 收到的是解析后的 id：node_modules 依赖与裸包名一律外部（消费者解析），
//   仓内源码（绝对路径，无 node_modules）参与打包。
const srcEntry = fileURLToPath(new URL("./src/index.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: srcEntry,
      formats: ["es"],
    },
    rolldownOptions: {
      external: (id) => {
        if (id.includes("node_modules")) return true;
        return !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0");
      },
      output: {
        preserveModules: true,
        entryFileNames: "[name].js",
      },
    },
  },
});
