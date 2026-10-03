# 兼容性矩阵（0.1.0-alpha.0）

以下是旧版历史实测记录。`0.1.0-alpha.1` 优化候选的构建/行为/浏览器证据以 `reports/optimization/` 为准，不自动沿用旧版结果。

发布批次：tokens / react / registry / mcp / cli 同版本 0.1.0-alpha.0（fixed changeset 组）。
本矩阵为**实测记录**（开发与验证环境），不是承诺支持范围。

## 运行时

| 项 | 版本 | 验证方式 |
| --- | --- | --- |
| Node | 24.21.0 LTS (Krypton) | 全部构建/测试/CLI/MCP 实测 |
| pnpm | 12.8.1（corepack + devDep pin） | workspace 安装 + /tmp 干净消费者安装 |
| React / React DOM | 19.3.0（peer `>=19.0.0 <20`） | 组件测试 + 消费者构建 |

## TypeScript

| 编译器 | 结果 |
| --- | --- |
| TS7 native（`@typescript/native` → 7.0.2） | 库 typecheck/声明输出、示例编译、消费者 typecheck ✓ |
| TS6（`@typescript/typescript6` → 内部 6.0.3） | typed lint（typescript-eslint 8.71）、消费者 `tsc6` typecheck ✓ |

## 构建 / 工具

| 工具 | 版本 | 验证 |
| --- | --- | --- |
| Vite | 8.3.2（Rolldown） | lib 构建（preserveModules、`use client` 保留）+ 消费者构建 |
| Storybook | 10.6.1 | build + react-docgen-typescript（TS6 API） |
| Vitest | 5.0.3 | 87 tests |
| ESLint / typescript-eslint | 10.11.0 / 8.71.0 | typed lint 0 |
| Biome | 2.5.15 | 仅格式化 |
| MCP SDK | server/client 2.2.0 + legacy sdk 1.31.0 | 双代客户端 stdio 实测 |

## 消费者

| 场景 | 结果 |
| --- | --- |
| 干净目录 Vite 消费者（pnpm 12.8.1 + tarball） | install/build/typecheck ✓ |
| Next 16.3.8（RSC 静态页 + "use client" 交互组件） | build ✓ 3/3 静态页 |
| Vue / Nuxt | 未开始（S6；当前 registry 仅 framework=react） |

## 已知限制

1. pnpm ≥12 默认 minimumReleaseAge 供应链政策会拒绝安装刚发布的依赖
   （motion@13.5.0 / vite@8.3.2 曾触发）；消费者可按 pnpm 文档 exclude 或等待窗口过期。
2. 消费者 TS 需为 CSS 副作用导入提供 bundler 类型（如 `vite/client`），否则 TS2882。
3. Safari/WebKit 真机、Firefox：未在本环境验证（Playwright 矩阵为后续任务）。

## 0.1.0-alpha.1 候选实证（2026-10-03）

当前候选结果覆盖以上历史记录中与本轮相关的未验项：Chrome154、Firefox153、Playwright WebKit26.5 的官网交互，独立tarball消费和TS7/SSR、134unit及MCP双代客户端通过。WebKit不是真实Safari/iOS，读屏和真机性能未验证。

详见 [实施汇总](reports/optimization/implementation-summary.md) 与 [原始结果](reports/optimization/verification-results.json)。候选没有npm发布；Vue/Nuxt仍未实现。
