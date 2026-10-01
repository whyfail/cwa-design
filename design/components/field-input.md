# Field / Input / Textarea 设计与 a11y 说明

状态：stable-in-alpha（0.1.0-alpha.0） · 评审：维护者待审

## 设计选择

- Field 承担 label/description/error 与控件的关联；关联 ID 经 context 下发，
  控件不必手动接线，也支持 Field 外独立使用（回退为无关联的普通 input）。
- id 由 `useId` 生成：SSR 前后一致，多 Field 不冲突；显式 `id` 可覆盖。
- 错误出现时控件获得 `aria-invalid`，error 文案 `role="alert"` 即时播报一次。
- required 视觉标记 `*` aria-hidden；真正的原生 `required`/校验由控件属性表达。

## a11y 说明

| 项 | 结论 |
| --- | --- |
| 标签关联 | label[for] ↔ input[id]（原生关联，点击 label 聚焦） |
| 描述 | description + error 一并进 aria-describedby |
| 错误 | role=alert 播报；颜色 + 文案双重传达，不只靠红框 |
| 键盘 | 原生 input 行为；无代理 |
| IME | 组件不监听/拦截 composition；Enter 提交由原生与业务决定 |

## 已验证 / 未验证

已验证（vitest + jsdom）：关联、稳定 id、aria-invalid、FormData 提交、受控同步、composition 事件不被拦截（合成事件冒烟）。

未验证：真实中文 IME（macOS 拼音/微软拼音）的 Enter 行为、浏览器自动填充样式、200% 缩放——留 T33 人工项；IME 结论在真实浏览器验证前**不宣称已通过**。

## 边界

- 不内置校验逻辑；error 由调用方传入。
- Form adapter（RHF/Zod）为 P1（T42）。
