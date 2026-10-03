# CWA Design 设计规则（design-rules）

来源：本地 Apple Design 技能（WWDC Designing Fluid Interfaces / Materials / Principles of Great Design 的 Web 转译）、Apple HIG、主计划 §4/§9/§10。T03 基线产物，随组件演进修订（须记 ADR）。

## 1. 评审顺序（不可调换）

**行为 → 可读性 → 层级 → 排版 → 材质 → 细节。**
先键盘/焦点/中断正确，再谈玻璃质感；对比度不过关时加厚材质或转 solid，不调透明度文字硬凑。

## 2. 材质策略

| 用途 | 默认材质 | Token |
| --- | --- | --- |
| 浮动 toolbar、navigation、popover | glass + regular | `glass-regular` |
| Sidebar、Dialog、Sheet | regular 或厚 frosted | `glass-thick` |
| 正文、Card、Form、Table | solid / frosted | `solid` |
| 玻璃容器内的 Button/Input | 实色 tint/薄填充 | 组件级填充，禁止再叠 `backdrop-filter` |
| 图片/视频上的少量控件 | glass + clear（显式 opt-in） | `glass-clear` |
| 高对比 / 减少透明 / 无 blur 支持 | solid（保留边框、焦点、层级） | `solid` |

硬规则：

1. **控制实际 backdrop 重叠**：toolbar 内控件共享玻璃外壳，不再独立 blur；独立菜单/Popover 可用 regular glass，覆盖玻璃区域时依据背景加厚或降级。Portal 不豁免视觉重叠，不能把所有浮层一律固化为实色。
2. 默认固定 blur，**只动画 transform/opacity**；blur 动画属后续独立验证项。
3. 不给父容器设 opacity（会连带文字透明并建立错误 backdrop root）。
4. 系统信号优先级：`forced-colors` > reduced-motion > reduced-transparency > `prefers-contrast: more` > 用户显式选择（solid 必须随时可用）。
5. `motion="full"` 不能覆盖系统 reduced-motion。

## 3. 运动预设（Motion 参数，Apple damping/response 的 Web 映射）

| 用途 | 预设 | Motion 参数 | 验收 |
| --- | --- | --- | --- |
| 控件反馈 | `control` | 80–120ms 颜色/transform 即时 | pointer-down 立即有反馈；disabled 无误导 |
| 布局/位置移动 | `move` | `type:spring, bounce:0, duration:0.4` | 可重定向，无回弹 |
| Sheet 拖动释放 | `sheet` | `type:spring, bounce:0.15, duration:0.35` | 保留释放速度；反向拖动无突跳 |
| 菜单/Popover 进出 | `overlay` | `type:spring, bounce:0, duration:0.3` + scale 0.94→1, opacity 0→1 | 触发器原点，进出路径一致 |
| reduced-motion | — | 短 opacity 交叉淡入或静态 | 无弹性/parallax/长距位移 |

原则：默认临界阻尼（bounce 0）；仅释放带动量的手势允许少量回弹；速度衔接——释放速度作为弹簧初速度传入；中断从当前呈现值重定向；`will-change` 及时设置并清理。

## 4. 排版

- 字体栈：`system-ui, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', 'Microsoft YaHei', sans-serif`；不随包分发任何字体文件。
- 正文 `1rem / 1.5`；caption ≥ `0.8125rem` 且验证可读；标题用负 tracking（display `-0.02em`）时必须验证中文，不全局负字距。
- 字号/字重/行高成套定义（Token `font-*`）；层级靠字重+字号+行高组合，不只靠字号。
- 间距全部 `rem`（尊重用户字号设置）；200% 文本缩放不溢出为验收项。

## 5. 状态矩阵

每个交互组件至少覆盖：`default / hover / pressed / focus-visible / disabled / loading`（适用的加 `open / selected / error`）。不适用的状态在组件 metadata 写明理由。状态不得只靠颜色传达（图标/文本/位置任一）。

## 6. 无障碍基线

- 目标 WCAG 2.2 AA：正文 ≥4.5:1，大字号 ≥3:1，非文本（边界/图形）≥3:1；**玻璃对比按真实合成背景测**（五类背景：白、黑、高亮照片、文本列表、彩色图表；另加棋盘格与明暗分区）。
- 焦点：`--cwa-design-focus-width: 2px` + offset 3px，永不被 sticky chrome 完全遮挡；2px 是产品标准。
- 点击目标常规 ≥44×44 CSS px（compact 模式仍评估实际可点区域；WCAG 2.2 AA 底线 24×24）。
- 拖动类交互必须有按钮/键盘替代；overlay 关闭恢复焦点，嵌套按栈恢复。
- IME composition 期间不拦截 Enter、不提前过滤。

## 7. 原型基线（T03 要求的三条）

1. **设置表单**（内容层，solid/frosted）：Field/Input/Select/Switch/Button 组合。
2. **浮动 toolbar**（功能层，regular glass）：内容在下方滚过，验证五背景可读性。
3. **可拖动 Sheet**（物理交互）：snap、速度衔接、中断反向。

本轮可操作实验室位于 `apps/docs` 的主题/材质页；官网、Storybook 与实际消费包使用同一公共材质层。维护者视觉确认单独记录。

## 8. 2026-10-03 玻璃优化目标（2026-10-04 按审查清单修订）

- 透射、非均匀顶部/侧缘 rim、轻反射、内顶高光/底缘和接触/环境投影共同表达厚度；磨砂 blur 不能单独充当玻璃。
- 公共材质 CSS 与源 Token 负责光学效果，官网仅提供布局和背景，不覆盖组件内部材质。
- 深色独立调校；系统减少透明、增强对比、forced-colors、显式 solid 与缺少 blur 支持均保留可靠回退。
- Regular 填充遮蔽候选：浅色 52%、深色 68%（中性石墨底 rgba(28,29,34)，替代蓝灰主导）；Thick 浅色 76%、深色 84%；Clear 浅色约 33% 合成（fill 0.20 + dimming 0.16）、深色约 52% 合成（fill 0.20 + dimming 0.40），层次按 Regular > Clear > Thick 递增遮蔽。玻璃内正文与焦点使用不透明正文色，副文字使用 `--cwa-design-color-glass-text-muted`（浅 #2b3039 / 深 #e4e4ea）；纯黑/纯白极端背景上副文字不达 4.5:1，此类内容应选 Thick 或 solid。
- 悬浮重量按用途分级：`elevation-small`（工具栏/胶囊/Tooltip）、medium（菜单/Popover/Toast，默认 shadow token）、`elevation-large`（Dialog/Sheet）。
- 内部控件共用凸起配方（surface 混合填充 + rim + 内高光），按压统一"缩放 + 内凹"并覆盖键盘（data-pressed + :active）；未选中分段项有 hover/active 反馈。
- Clear 用于媒体上的轻工具栏：浅色配亮调媒体、深色配暗调媒体；全表单套用 Clear 属滥用场景，官网实验室对此有明确提示。
- 候选数值待维护者实图评审；代码、自动检查、浏览器检查与 accepted 分开记录。
