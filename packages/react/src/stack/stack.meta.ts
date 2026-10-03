import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const stackMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "stack",
  name: "Stack",
  description: "横向或纵向的 Flex 布局；gap 是数值 Token 刻度。",
  typeName: "StackProps",
  sourceTypePath: "packages/react/src/stack/stack.tsx#StackProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Stack"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    direction: {
      type: "enum",
      values: ["row", "column"],
      default: "column",
    },
    gap: {
      type: "enum",
      values: [1, 2, 3, 4, 5, 6, 8],
      description: "实现为 space-1 × gap，不保证与所有命名 space Token 的值一一相等",
      default: 4,
    },
    wrap: {
      type: "boolean",
      default: false,
    },
    children: {
      type: "node",
      summary: "ReactNode；内容由调用方提供",
      required: false,
    },
  },
  extends: ["React.HTMLAttributes<HTMLDivElement>"],
  materialPolicy: "inherit-parent-surface",
  materialNotes: "仅布局，不绘制背景。",
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["stack-basic"],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentSourceRecord;
