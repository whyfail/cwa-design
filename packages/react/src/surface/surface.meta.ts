import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const surfaceMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "surface",
  name: "Surface",
  description: "通用表面容器；正文用 solid/frosted，浮动层可显式使用 glass。",
  typeName: "SurfaceProps",
  sourceTypePath: "packages/react/src/surface/surface.tsx#SurfaceProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Surface"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    material: {
      type: "enum",
      values: ["solid", "frosted", "glass", "glass-clear"],
      default: "solid",
    },
    children: {
      type: "node",
      summary: "ReactNode；内容由调用方提供",
      required: false,
    },
  },
  extends: [
    "React.HTMLAttributes<HTMLDivElement>；className/style、DOM 事件、aria-*、data-* 均由原生类型继承",
  ],
  materialPolicy: "solid",
  materialNotes:
    "默认 solid；frosted 轻分离；glass=regular；glass-clear 仅媒体控件显式启用。Provider solid 与系统回退优先。" +
    "背景可读性（默认 Token 实测：2 主题 × 11 背景 × 4 材质，Chromium 1440×1000，未取整 4.5:1，逐包围框采样）：regular 的正文与控件标签除“深色×纯白”（正文样本实测最低 3.910:1，<4.5）外全部 ≥4.5:1；" +
    "regular 副文字仅保证中等亮度背景（山水/文字列表/图表/棋盘）与同向极端背景（浅色×纯白、深色×纯黑）。" +
    "默认已测压力背景（存在 <4.5:1 样本，请改 frosted/solid 或给控件局部实色底面）：浅色×{暗插画, 明暗分区, 纯黑}、深色×{亮插画, 纯白}。" +
    "glass-clear 用于完整表单属不推荐用途（同向极端背景仍实测可达标）；作为媒体轻工具栏按媒体逐个验证：深色主题的真实亮/暗照片实测通过，浅色主题的真实照片与明暗分区实测失败。" +
    "显式 tint/accent 覆盖不在默认矩阵范围内，采用后需在实际背景复查。",
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["surface-basic", "surface-clear-toolbar"],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentSourceRecord;
