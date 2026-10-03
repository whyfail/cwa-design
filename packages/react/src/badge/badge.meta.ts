import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const badgeMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "badge",
  name: "Badge",
  description: "状态或计数标签；tone 不能替代文本含义。",
  typeName: "BadgeProps",
  sourceTypePath: "packages/react/src/badge/badge.tsx#BadgeProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Badge"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    tone: {
      type: "enum",
      values: ["neutral", "accent", "success", "warning", "danger"],
      default: "neutral",
    },
    max: {
      type: "number",
      description: "数字 children 超过 max 时显示 max+",
    },
    children: {
      type: "node",
      summary: "ReactNode；内容由调用方提供",
      required: false,
    },
  },
  extends: ["React.HTMLAttributes<HTMLSpanElement>"],
  materialPolicy: "inherit-parent-surface",
  materialNotes: "轻 tint，不额外 blur。",
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["badge-basic"],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentSourceRecord;
