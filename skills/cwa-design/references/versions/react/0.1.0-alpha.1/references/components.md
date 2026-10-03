# 组件摘要（0.1.0-alpha.1）

| id | 名称 | 用途 | 材质策略 |
| --- | --- | --- | --- |
| provider | CwaProvider | 主题、材质、动效、密度与 Portal 的应用根；将所有需要上下文的组件置于其内。 | inherit-parent-surface |
| surface | Surface | 通用表面容器；正文用 solid/frosted，浮动层可显式使用 glass。 | solid |
| button | Button | 执行动作的原生按钮；表单提交需显式 type="submit"。 | inherit-parent-surface |
| icon-button | IconButton | 只含图标的原生按钮；必须提供 label 作为可访问名称。 | inherit-parent-surface |
| stack | Stack | 横向或纵向的 Flex 布局；gap 是数值 Token 刻度。 | inherit-parent-surface |
| text | Text | 正文或辅助文字；标签语义与视觉样式可分别选择。 | inherit-parent-surface |
| heading | Heading | 语义级别与视觉尺寸独立；level 必填并决定实际 h1–h6。 | inherit-parent-surface |
| field | Field | 稳定关联 label/description/error 与 Input/Textarea；required 只控制标记，原生 required 仍传给控件。 | inherit-parent-surface |
| input | Input | 原生单行输入；value/defaultValue/onChange 和 IME 使用原生事件。 | inherit-parent-surface |
| textarea | Textarea | 原生多行输入；value/defaultValue/onChange 与 IME 由浏览器处理。 | inherit-parent-surface |
| separator | Separator | 水平或垂直分隔线；非装饰性时保留 separator 语义。 | inherit-parent-surface |
| badge | Badge | 状态或计数标签；tone 不能替代文本含义。 | inherit-parent-surface |
| avatar | Avatar | 固定几何头像；无 src 时显示 fallback，图片加载由 Base UI 管理。 | inherit-parent-surface |
| card | Card | 内容卡片；使用显式分区组合标题、正文与操作。 | solid |
| spinner | Spinner | 不确定进度指示；label 控制可访问名称。 | inherit-parent-surface |
| skeleton | Skeleton | 固定占位几何；为加载中的内容预留宽高。 | inherit-parent-surface |
| checkbox | Checkbox | 二态/不确定复选框；children 在 label 内渲染。 | inherit-parent-surface |
| radio-group | RadioGroup | 单选选项组；方向键导航与隐藏表单 input 由 Base UI 提供。 | inherit-parent-surface |
| switch | Switch | 即时二态设置；children 在 label 内渲染。 | inherit-parent-surface |
| select | Select | 字符串值单选；选择值用 Select，动作菜单用 DropdownMenu。 | glass-regular |
| slider | Slider | 单 Thumb 数值滑块；箭头/Home/End 为拖拽替代。 | inherit-parent-surface |
| tabs | Tabs | 切换关联内容面板；小规模互斥设置使用 SegmentedControl。 | inherit-parent-surface |
| segmented-control | SegmentedControl | 2–5 个互斥设置选项；RadioGroup 语义，不是内容 Tabs。 | inherit-parent-surface |
| tooltip | Tooltip | hover/focus 的非交互说明；交互内容使用 Popover。 | solid |
| popover | Popover | 锚定的非模态浮层；焦点、外部点击与定位由 Base UI 管理。 | glass-regular |
| dropdown-menu | DropdownMenu | 触发动作的菜单；不是表单选择值控件。 | glass-regular |
| dialog | Dialog | 模态对话框；焦点陷阱、Escape、滚动锁与恢复由 Base UI 管理。 | glass-thick |
| sheet | Sheet | bottom/end 单展开位抽屉；可拖拽关闭并提供关闭按钮作为替代。 | glass-thick |
| toast | ToastProvider | 应用通知队列；外部触发可创建 manager 并传入 toastManager。 | solid |
| alert | Alert | 页面内的即时状态提示；所有 tone 均渲染 role="alert"。 | solid |
