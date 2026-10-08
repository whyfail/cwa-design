import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // skill.test（生成器幂等）与 manifest.test 共享真实仓库文件系统
    // （rmSync + 重写 references），并行会引入 rm/读竞态；本包内文件串行。
    fileParallelism: false,
  },
});
