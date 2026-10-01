# ADR-0003：Vite 8 library mode 的 CSS 产出方式

状态：accepted（T02 实测） · 日期：2026-10-02

## 背景

主计划 §7.2 要求 Alpha 只承诺统一入口 `@cwa-design/react/styles.css`，
JS/CSS 由 Vite library mode 构建。Vite 8（Rolldown）实测行为：
**lib 模式强制 `cssCodeSplit: false`，此时 `rolldownOptions.input` 不允许包含 CSS 文件**
（报错：`When "build.cssCodeSplit: false" is set, "rolldownOptions.input" should not include CSS files.`）。

## 决策

- `vite build` 只承担 JS（lib entry = `src/index.ts`，preserveModules，external react）。
- CSS 以小脚本 `packages/react/scripts/copy-styles.mjs` 按源码相对结构拷贝到 dist：
  - `src/styles.css` → `dist/styles.css`（内含 `@import "./button/button.css"`，相对路径在 dist 内可解析）
  - `src/button/button.css` → `dist/button/button.css`
- 构建顺序为 `vite build && node scripts/copy-styles.mjs && tsc -p tsconfig.build.json`：
  vite 默认清空 outDir，`tsc` 声明必须在其后生成（首跑实测曾因此丢失 .d.ts）。
- 消费者侧 bundleer（Vite/Next/打包器）解析 CSS `@import`；TS 消费者需要 bundler 类型声明
  （`vite/client` 等）才能通过 CSS 副作用导入的 typecheck（TS2882，属消费者常规配置，将在文档写明）。

## 备选被否决

- 双 vite build（第二次纯 CSS build）：会产出空 JS chunk，需清理，复杂度更高。
- lib 双 entry 含 CSS：Vite 8 直接报错（见上）。

## 后续

- per-component CSS 与 CSS 去重/共享 Token 分析在独立样式任务中验证后再公开（主计划 §7.2）；
  若届时引入 postcss/压缩，重审本 ADR。
