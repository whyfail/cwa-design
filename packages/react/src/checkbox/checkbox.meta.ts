import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const checkboxMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "checkbox",
  name: "Checkbox",
  description: "二态/不确定复选框；children 在 label 内渲染。",
  typeName: "CheckboxProps",
  sourceTypePath: "packages/react/src/checkbox/checkbox.tsx#CheckboxProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Checkbox"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    children: {
      type: "node",
      summary: "ReactNode；内容由调用方提供",
      required: false,
    },
    className: {
      type: "string",
      description: "附加样式类；具体合并行为以实现为准",
    },
  },
  extends: [
    "@base-ui/react/checkbox#CheckboxRootProps；checked/defaultChecked/onCheckedChange/indeterminate/disabled/name/value 及原生属性完整继承",
  ],
  materialPolicy: "inherit-parent-surface",
  materialNotes: "轻填充控件，不独立 blur。",
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["checkbox-basic"],
  runtimeDependencies: ["@base-ui/react"],
  deprecated: false,
} satisfies ComponentSourceRecord;
