# CWA Design 仓库规范

CWA Design 是面向开发者与 AI 编程助手的 Apple 风格 Web 组件库（React 首发，Vue 随后）。
开发方案来源：`/Users/wulei/Desktop/CWA-Design-开发方案`（主计划 01、任务清单 02、启动提示词 03、版本核验 04）。
本轮优化：`/Users/wulei/Desktop/CWA-Design-玻璃风格与官网优化计划-2026-10-03.md`；冲突时采用本轮材质与官网要求。

## 任务流程

- 本轮 R00–R23 状态：`tasks/status.json`；报告：`reports/optimization/<ID>.md`；旧 T 状态保留在 `tasks/archive/`。
- 状态流转 `planned → ready → in_progress → implemented → verified → accepted`；
  `implemented` 不等于通过测试；`verified` 必须有真实检查证据；`accepted` 只能由维护者给出。
- 依赖任务未 `verified`/`accepted` 前不启动下游任务。
- 公共 Token、schema、exports、基础 overlay 同一时间只允许一个执行者修改。
- 遇到失败先做最小复现；重复失败写诊断并暂停该任务扩展，不悄悄替换技术选型。

## Shell 规范（RTK）

- 本机所有 shell 命令以 `rtk` 开头；不支持的命令用 `rtk proxy zsh -lc '...'`。
- 使用 `rtk git status`、`rtk rg`、`rtk pnpm <script>` 等包装形式。

## 工具链基线（T00 核验，2026-10-02）

- Node 24.21.0 LTS（nvmd 管理）；pnpm 12.8.1（corepack 按 packageManager 字段提供）。
- TypeScript 7.0.2（`@typescript/native` alias，`tsc`）+ TypeScript 6（`typescript` 包名 alias 到 `@typescript/typescript6`，供 docgen/typed lint 的 compiler API）。
- Vite 8 library mode（Rolldown）；Base UI 为唯一 headless 行为源；Motion 只用于 spring/gesture。
- exact pin 全部依赖；lockfile 提交；不使用 beta/RC 作为核心依赖。

## 设计与实现约束

- regular glass 用于浮动功能层/导航/独立浮层，须有透射、rim、反射、内壁与投影；正文/Card 保持可读；clear 仅显式 opt-in。
- 控制实际重叠与 backdrop 采样层数：共享玻璃外壳内控件不重复 blur；不能因此把所有浮层固定实色。细则见 `design/rules/design-rules.md`。
- 固定 blur，只动画 transform/opacity；系统 reduced-motion 优先；solid 材质可显式选择。
- pointer-down 立即反馈；保留原生 click/键盘语义。
- 样式前缀 `cwa-design-`，稳定 `data-*` hook；`exports` 覆盖根、子路径与 styles.css；CSS 保留 sideEffects。
- 组件交付物：源码、类型、CSS、metadata、stories、可编译示例、行为检查、a11y 说明。

## 检查纪律

- 只报告实际执行过的检查；没有运行结果不写"已验证"。
- 不关闭检查、不降低阈值、不批量重写截图基线来掩盖失败。
- 报告不写入 key/token/敏感环境变量。

## 常用检查

- 使用 `rtk proxy env NVMD_NODE_VERSION=24.21.0 corepack pnpm`；按包运行 `--filter <package> typecheck` / `test`。
- 对单文件运行 `exec eslint <path>`；格式配置在 `biome.json`；官网 build 必须生成真实深链接 HTML。
- AI 参与的提交使用真实模型署名的 Co-Authored-By；本轮不自动提交或发布。
