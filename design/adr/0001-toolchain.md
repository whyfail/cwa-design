# ADR-0001：工具链基线与 TypeScript 7/6 双编译器方案

状态：accepted（T02 兼容性 spike 实测通过） · 日期：2026-10-02

## 背景

主计划 §6 要求"最新稳定 + Node LTS"，其中 TypeScript 7.0.2 无 compiler API，
ESLint/docgen 需要 TS6 compiler API，微软官方建议 alias 并行安装（主计划 §6.3）。

## 决策

### 依赖别名（按主计划 §6.3，已实测）

```json
{
  "@typescript/native": "npm:typescript@7.0.2",
  "typescript": "npm:@typescript/typescript6@6.0.2"
}
```

2026-10-02 在本仓实测（pnpm 12.8.1 / Node 24.21.0）：

| 命令/导入 | 实测结果 |
| --- | --- |
| `pnpm exec tsc --version` | `Version 7.0.2`（TS7 native CLI） |
| `pnpm exec tsc6 --version` | `Version 6.0.3`（`@typescript/typescript6` 提供 `tsc6` bin，wrapper 内部解析 TS6 6.0.3，与主计划"由 lockfile 固定"的要求一致） |
| `require("typescript").version` | `6.0.3`（`import typescript` 走 TS6 compiler API） |

- 库 typecheck 与 `.d.ts` 输出：TS7 CLI（`tsc -p tsconfig.build.json`，emitDeclarationOnly）。
- Storybook docgen：`typescript.reactDocgen: "react-docgen-typescript"`（注意：Storybook 10.6 该选项**位于 `typescript` 键下**，顶层写法被忽略且类型报错），经 TS6 compiler API 运行，产物含 `__docgenInfo`。
- typescript-eslint 8.71.0 typed lint：peer `typescript >=4.8.4 <6.1.0` 由 6.0.3 满足，实际运行通过。

### 工具链其余基线

- Node 24.21.0 LTS（nvmd 管理）；engines `node >=24.0.0`。
- pnpm 12.8.1：根 `packageManager` 字段 + corepack 提供；同时 devDependency exact pin（保证 `pnpm -r` 脚本在 corepack 场景可解析）。嵌套脚本不直接调 `pnpm`，改为直接调 tsc/vite/vitest。
- Vite 8.3.2 library mode（Rolldown）：`external: ["react","react-dom","react/jsx-runtime"]`，`output.preserveModules: true`；`"use client"` 指令在产物中保留（实测）。
- ESLint 10.11.0（typed lint，flat config）+ Biome 2.5.15（仅格式化）。
- MCP：`@modelcontextprotocol/server` / `client` 2.2.0 + legacy `@modelcontextprotocol/sdk` 1.31.0（见 ADR-0004）。

## 影响

- `tsc` 恒为 TS7；需要 TS6 API 的工具通过 `typescript` 包名导入，不得升级该别名到 6.1+（会破坏 typescript-eslint peer）。
- Vue 阶段（S6）vue-tsc/TS6 兼容性另测，不在此 ADR 承诺。
