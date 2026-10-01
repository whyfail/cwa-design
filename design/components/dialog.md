# Dialog 设计与 a11y 说明

状态：stable-in-alpha（0.1.0-alpha.0） · 评审：维护者待审

## 设计选择

- 行为源：Base UI Dialog（focus trap、Escape、scroll lock、焦点恢复、嵌套栈）——T10 单一行为基础，不自建第二套 overlay 状态机。
- 材质：默认 `glass-thick`（大面积浮层需要更强分离）；**叠在玻璃内容层之上时用 `material="solid"`**（禁止 glass-on-glass，design-rules §2）。
- 主题化 portal：OverlayPortalScope 将 Provider 的 theme/material/motion/density 属性复制到 portal 子树。
- 动效：scale 0.96→1 + opacity，进出同路径；只动 transform/opacity；reduced-motion 移除位移。

## a11y 说明

| 项 | 结论 |
| --- | --- |
| 焦点 | 打开进入 dialog，Tab 循环不逃出（Base UI focus trap），关闭恢复触发器焦点 |
| Escape | 关闭；关闭途中重新打开取消退出并保持语义一致（测试覆盖） |
| 标题 | Dialog.Title 关联 dialog accessible name；Description 关联 aria-describedby |
| 滚动锁 | Base UI scroll lock；嵌套 dialog 按栈解锁 |
| 组合 | Trigger/Close 用 Base UI `render` prop 组合 CWA Button（不产生嵌套 button） |

## 已验证 / 未验证

已验证（vitest + jsdom）：开/关渲染、Title/Description 关联、Escape 关闭 + onOpenChange(false, details)、焦点恢复触发器、快速开关不卡死、CWA Button 组合。

未验证：真实浏览器中的滚动锁与 sticky chrome 交互、VoiceOver 焦点播报、动效帧稳定性（T33 人工项）。

## 边界

- 不提供非模态 dialog（用 Popover）；dangerous confirm 配 Alert 语义（P1）。
