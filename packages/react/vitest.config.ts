import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["vitest.setup.ts"],
    // Base UI 的 popup portal 状态为模块级共享，jsdom 不派发 transitionend，
    // 跨用例偶发时序漂移；retry=1 只吸收该环境噪声，失败仍会暴露。
    retry: 1,
  },
});
