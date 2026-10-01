# Button / IconButton 设计与 a11y 说明

状态：stable-in-alpha（0.1.0-alpha.0） · 评审：维护者待审

## 设计选择

- **变体**：primary（每视图最多一个主操作）/ secondary / ghost / danger。danger 用于破坏性动作，确认对话框另议（不复用 danger 表示"完成"）。
- **尺寸**：md 高 44px（44×44 点击目标基准，design-rules §6）；sm 32px 供玻璃浮层/紧凑密度；lg 52px。
- **材质**：`inherit-parent-surface`。按钮位于玻璃层内时为实色/薄填充（secondary 的 `color-mix` 填充），不叠 backdrop-filter。
- **反馈**：pointer-down 即 `data-pressed`（scale 0.97 + opacity），click 才提交；拖出取消（pointerleave/cancel 清除）。
- **loading**：disabled + aria-busy + 旋转指示器；保留宽度，避免布局跳变。

## a11y 说明

| 项 | 结论 |
| --- | --- |
| 语义 | 原生 `<button>`；type 默认 `button`，submit 走原生表单提交 |
| 键盘 | Enter/Space 原生激活；Tab 序按 DOM |
| 焦点 | `:focus-visible` 2px outline + 3px offset（tokens） |
| 名称 | 文本内容；IconButton 以 `label` → aria-label 强制命名 |
| 状态 | loading→aria-busy+disabled；颜色不单独传达状态 |
| 目标尺寸 | md/lg ≥44×44；sm 32×32 需周围留白（紧凑模式评估项） |

## 已验证 / 未验证

已验证（vitest + jsdom）：原生语义、click/disabled、loading aria-busy、pointerdown 反馈、ref 转发、表单提交、Enter/Space、受控 loading。

未验证（留待人工/浏览器）：VoiceOver/NVDA 实际朗读、真实指针设备的按下反馈帧率、五类复杂背景上的 secondary 填充对比度（T33）。

## 边界

- loading 期间忽略 onClick（防重复提交）；需要可交互的 busy 状态请用 aria-busy 自定义。
- 不提供 `as` 多态；需要链接样式用 P1 Link 组件。
