# CWA Design

**已部署网站：https://whyfail.github.io/cwa-design/ · Storybook：https://whyfail.github.io/cwa-design/storybook/**

面向开发者与 AI 编程助手的 Apple 风格 Web 组件库（React 首发，Vue 随后）。

开发方案：`/Users/wulei/Desktop/CWA-Design-开发方案`（主计划 01 · 任务清单 02 · 启动提示词 03 · 版本核验 04）。
本轮玻璃与官网优化：`/Users/wulei/Desktop/CWA-Design-玻璃风格与官网优化计划-2026-10-03.md`。
当前任务：`tasks/status.json` · 优化报告：`reports/optimization/` · 历史报告：`reports/tasks/` · 设计规则：`design/rules/design-rules.md`。

## 包

| 包 | 说明 |
| --- | --- |
| `@cwa-design/tokens` | Token JSON 单一来源 → 生成 CSS 变量（light/dark、材质、motion 预设） |
| `@cwa-design/react` | React 组件库，30 个公共组件与三个业务组合 |
| `@cwa-design/registry` | Registry schema 与版本规则（AI 单一事实来源的契约层） |
| `@cwa-design/mcp` | 只读 stdio MCP server（确切版本、源码/hash/分页；两代客户端已验证） |

## 使用（Alpha 形态）

当前候选 `0.1.0-alpha.1` 尚未发布 npm。先通过源码 workspace 构建与示例使用；已部署网站可能仍为前一版本，不能以本地候选版本推断线上已更新。

```bash
rtk proxy env NVMD_NODE_VERSION=24.21.0 corepack pnpm install --frozen-lockfile
rtk proxy env NVMD_NODE_VERSION=24.21.0 corepack pnpm run build
rtk proxy env NVMD_NODE_VERSION=24.21.0 corepack pnpm --filter @cwa-design/docs preview
```

官网通过实际构建生成详情 HTML。Pages 构建使用 `/cwa-design/` base，详见 `apps/docs` 和部署 workflow；Storybook 继续作为开发与状态调试入口。

```tsx
import { CwaProvider, Button, Field, Input } from "@cwa-design/react";
import "@cwa-design/react/styles.css";

<CwaProvider theme="system" material="auto" motion="system" locale="zh-CN">
  <Field label="显示名称" description="用于个人资料">
    <Input name="displayName" defaultValue="CWA Developer" />
  </Field>
  <Button variant="primary" type="submit">保存设置</Button>
</CwaProvider>
```

## 工具链

Node 24.21.0 LTS · pnpm 12.8.1（corepack，`packageManager` 已固定）·
TypeScript 7（`tsc`）+ TS 6 alias（`tsc6` / docgen / typed lint）·
Vite 8（Rolldown，preserveModules）· Base UI（headless 行为唯一源）· Motion（spring/gesture）·
Storybook 10.6 · Vitest 5 · ESLint 10 + typescript-eslint（typed）· Biome（仅格式化）。

```bash
corepack pnpm install
corepack pnpm run build   # 全仓构建
corepack pnpm -r --if-present run test    # 实际数量与结果见本轮报告
corepack pnpm lint                        # typed lint
```

## 状态（2026-10-03）

当前 R00–R23 负责公共玻璃材质、正式官网、真实 AI 契约与回归。旧 T 任务状态归档在 `tasks/archive/`；历史代码或测试数量不等于本轮视觉/官网验收。

许可证 MIT，见 `LICENSE`。包名为 `@cwa-design/*`；没有虚构 npm 发布、Vue 支持或远程 MCP 服务。维护者视觉接受与真实 Safari/iOS、读屏检查单独记录。
