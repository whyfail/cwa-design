---
name: cwa-design
description: Use when building, styling, reviewing, or migrating interfaces with CWA Design. Read the installed framework and version before selecting components or generating code.
---

# CWA Design

Apple 风格、透明玻璃材质的 Web 组件库（React 首发）。本 Skill 供应用开发者与 AI 编程助手使用已发布组件。

## 使用流程

1. 读 `package.json` 与 lockfile，确认框架与已安装的 `@cwa-design/react` 版本。
2. 读 `references/overview.md`，与已装版本对照；版本不一致时以已装版本为准。
3. 按 `references/components.md` 的摘要选组件；只在需要时查 `references/contracts/<id>.json`。
4. 优先复用现有组件与组合，**绝不发明不存在的 import 或 props**。
5. 材质规则：regular glass 只用于浮动控件/导航层；正文、表单、Card 用 solid/frosted；
   玻璃层上的浮层用 solid；禁止 glass-on-glass；clear 玻璃仅媒体控件显式启用。
6. 尊重 reduced-motion / reduced-transparency、可见焦点、label 关联与键盘操作。
7. 产出可审查补丁；沿用项目现有包管理器与约定。
8. 运行相关 type/build/检查并查看渲染结果。
9. 如实报告验证结果与未解决失败；未运行的测试不得声称通过。

## 安装与样式（单一入口）

```bash
pnpm add @cwa-design/react
```

```tsx
import "@cwa-design/react/styles.css"; // 引入一次；内含 tokens（light/dark/材质/动效变量）
```

```tsx
import { CwaProvider } from "@cwa-design/react";

<CwaProvider theme="system" material="auto" motion="system" locale="zh-CN">
  {children}
</CwaProvider>
```

## 公共组件（P0，30 个）

基础：CwaProvider · Surface
动作：Button · IconButton
排版：Stack · Text · Heading
字段：Field · Input · Textarea
选择：Checkbox · RadioGroup · Switch · Select · Slider · SegmentedControl
信息：Separator · Badge · Avatar · Card · Spinner · Skeleton · Alert
导航：Tabs
浮层：Dialog · Sheet · Tooltip · Popover · DropdownMenu
通知：Toast（ToastProvider + createToastManager）

各组件的最小边界见 `references/components.md`；完整契约（props/a11y/材质策略）见
`references/contracts/<component-id>.json`（来自 registry manifest，含 contentDigest）。

## 硬性约束

- 不发明 API：只使用契约 JSON 中列出的 exports/props。
- 版本不匹配时明确说明，不混用新版本 API。
- Toast 需要业务侧持有 `createToastManager()` 实例并传入 `ToastProvider` 的 `toastManager`。
- 表单提交使用原生 `<form>`；Field 自动完成 label/description/error 关联。
- 拖拽类组件（Sheet/Slider）必须有键盘替代，此为组件内建行为，不要移除。

## 无 MCP 时

本 Skill 自包含：references 与组件契约随包分发，离线可用。若宿主提供 CWA MCP 工具，
优先用版本化工具查询（数据同源）；两者都不存在时仅凭本文件，并明确说明依据版本。
