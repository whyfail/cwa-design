# ADR 0001：Portal 的 CWA Token 覆盖作用域传递

日期：2026-10-05。状态：已接受（本轮实现）。
背景：第二轮复核 V02——主题实验室设置 Jade 主色 + 显式 67% 遮蔽后，面板变量正确，
但打开的 Popover（Portal 挂到 body）回落到默认 `#005fbe` / `#ffffff85`。

## 决策

1. **覆盖的受支持位置是 `CwaProvider` 根元素**：`className`（如导出的
   `.my-cwa-theme` 作用域类）、`style` 内联变量，以及 Provider 自身的
   `data-cwa-theme/material/motion/density` 属性。文档与实验室只引导这一路径。
2. **Portal 作用域在打开时从最近 Provider 根同步 Token 差异**：`OverlayPortalScope`
   在浮层挂载（useLayoutEffect）时枚举 Provider 根元素计算样式中的全部
   `--cwa-design-*` 自定义属性，与 Portal 作用域元素的自然解析值逐项比较，
   仅把不同的值以内联样式写到作用域元素上；相同的值不写（保持属性/主题机制的
   自然级联与后续可变性）。同步集合记录在 ref 上，重同步前先清除上一轮内联值。
3. **动态更新**：MutationObserver 监听 Provider 根的
   `style/class/data-cwa-*` 属性变化，浮层打开期间重同步；Context 值
   （theme/material/motion/density）变化时也重同步。不做每帧 `getComputedStyle`。
4. **优先级不变**：显式 `material="solid"`、系统 reduced-motion/reduced-transparency、
   forced-colors 的回退由属性选择器实现，Token 内联值不会绕过它们；嵌套 Provider
   时 OverlayPortalScope 消费最近一层 Context，即最近 Provider 的根元素。
5. **自定义 portalContainer**：容器只改变挂载位置，OverlayPortalScope 仍在
   Portal 内渲染，因此同步行为与默认 body 容器一致。

## 否决的备选

- **把 Portal 挂进 Provider 子树**：固定定位会被消费应用中的 transform/filter
  祖先捕获，破坏浮层定位与逃逸语义。
- **复制整个布局 className 到 Portal**：把宿主布局样式带进浮层，产生新的污染面。
- **每帧读取计算样式**：打开期间持续读取会引入持续布局成本，且无必要。
- **只修官网 Popover 的私有 CSS**：不解决任何真实消费者的问题。

## 后果

- 实验室/消费者把覆盖放在 Provider 上即可全链路一致（面板与浮层同色）。
- Provider 与触发器之间的中间元素上定义的 Token 覆盖不会传到 Portal；该模式
  不属于受支持路径，文档明确说明。
- 打开时的同步成本约为 O(Provider 上的自定义属性数)（约 100+ 次属性读取，一次）。
