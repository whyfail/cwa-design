# CWA Design

面向开发者与 AI 编程助手的 Apple 风格 Web 组件库（React 首发，Vue 随后）。

开发方案：`/Users/wulei/Desktop/CWA-Design-开发方案`（主计划 01 · 任务清单 02 · 启动提示词 03 · 版本核验 04）。
任务状态：`tasks/status.json` · 报告：`reports/tasks/` · 设计规则：`design/rules/design-rules.md` · ADR：`design/adr/`。

## 包

| 包 | 说明 |
| --- | --- |
| `@cwa-design/tokens` | Token JSON 单一来源 → 生成 CSS 变量（light/dark、材质、motion 预设） |
| `@cwa-design/react` | React 组件库（P0 全部 30 个公共组件（2026-10-02） |
| `@cwa-design/registry` | Registry schema 与版本规则（AI 单一事实来源的契约层） |
| `@cwa-design/mcp` | 只读 stdio MCP server（spike：当前 2.2.0 + legacy 1.31.0 客户端已验证） |

## 使用（Alpha 形态）

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
corepack pnpm -r --if-present run build   # 全仓构建
corepack pnpm -r --if-present run test    # 98 个行为/schema/契约测试
corepack pnpm lint                        # typed lint
```

## 状态（2026-10-03）

T00–T24、T26–T29 已执行（详见 `reports/tasks/` 与 `reports/PHASE-S3.md`），P0 30 组件 + recipes + manifest + CLI + MCP + Skill 完成。Alpha 剩余：T25 文档站成品页、T30 宿主矩阵、T32 AI 评测、T33 人工 a11y、T34 正式发布（候选物料已备）。

许可证 UNLICENSED（待维护者决定）；`@cwa-design/*` 为暂定名。未发布到 npm。
