# Sheet 设计与 a11y 说明

状态：implemented（待浏览器实测后升 verified） · 评审：维护者待审

## 设计选择

- **Alpha 范围（按主计划 T12 允许）**：单展开位 + 拖动关闭；多 snap points 为后续 API，未冒充已支持。
- 行为源：Base UI Dialog（焦点/Escape/滚动锁/嵌套栈）；拖拽：Motion（value + velocity）。
- 进出动画在外层 Popup（CSS transform/opacity）；拖拽位移在内层 motion.div —— 分层避免 transform 冲突。
- 释放逻辑：位移 >96px 或速度 >700px/s 关闭；否则按 sheet 预设（bounce 0.15, 0.35s）从当前位置带速度复位；reduced-motion 下瞬时复位（保留跟手，去掉弹性）。
- 拖拽区 `touch-action: none` 限于把手/头部区域应由调用方控制；Alpha 当前在内容层整体，**内容滚动冲突的精细化（滚动到顶才开始拖）未实现**，已知限制。

## a11y 说明

| 项 | 结论 |
| --- | --- |
| 语义 | Base UI dialog 语义；Sheet.Title 关联 accessible name |
| 键盘 | Escape 关闭；拖拽关闭有按钮替代（Close） |
| 焦点 | 打开进入、关闭恢复（Base UI） |
| 位置 | bottom / end（inset-inline-end，RTL 镜像布局；RTL 拖拽方向镜像为已知限制） |

## 已验证 / 未验证

已验证（vitest + jsdom）：开/关、Escape + onOpenChange(false)、受控 open、unmount 清理、Title 关联。

未验证（须真实浏览器/指针，T12-B/C/D 子卡 + T33）：真实拖拽中断与反向、pointercancel、capture 丢失、多点触摸、内容滚动冲突、速度投影手感、动效帧率。**拖拽手感在浏览器实测前不宣称已通过。**
