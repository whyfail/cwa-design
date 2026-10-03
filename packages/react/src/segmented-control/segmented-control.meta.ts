import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const segmentedControlMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "segmented-control",
  name: "SegmentedControl",
  description: "2–5 个互斥设置选项；RadioGroup 语义，不是内容 Tabs。",
  typeName: "SegmentedControlProps",
  sourceTypePath:
    "packages/react/src/segmented-control/segmented-control.tsx#SegmentedControlProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["SegmentedControl"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    items: {
      type: "array",
      summary: "SegmentedControlItem[]：{ value: string; label: ReactNode; disabled?: boolean }",
      required: true,
    },
    value: {
      type: "string",
    },
    defaultValue: {
      type: "string",
    },
    onValueChange: {
      type: "function",
      summary: "(value: string) => void",
    },
    "aria-label": {
      type: "string",
    },
    className: {
      type: "string",
      description: "附加样式类；具体合并行为以实现为准",
    },
  },
  extends: [],
  materialPolicy: "inherit-parent-surface",
  materialNotes: "分段选中填充，不额外 blur；必须提供组名称。",
  a11y: [
    "accessible-name-required-for-controls",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["segmented-control-basic"],
  runtimeDependencies: ["@base-ui/react"],
  deprecated: false,
} satisfies ComponentSourceRecord;
