import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const buttonMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "button",
  name: "Button",
  description: '执行动作的原生按钮；表单提交需显式 type="submit"。',
  typeName: "ButtonProps",
  sourceTypePath: "packages/react/src/button/button.tsx#ButtonProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Button"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    variant: {
      type: "enum",
      values: ["primary", "secondary", "ghost", "danger"],
      default: "primary",
    },
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
    },
    loading: {
      type: "boolean",
      default: false,
    },
    ref: {
      type: "ref",
      summary: "React.Ref<HTMLButtonElement>",
    },
    children: {
      type: "node",
      summary: "ReactNode；内容由调用方提供",
      required: false,
    },
    type: {
      type: "enum",
      values: ["button", "submit", "reset"],
      origin: "inherited",
      description: "实现为原生 type 提供 button 默认值",
      default: "button",
    },
  },
  extends: [
    "React.ButtonHTMLAttributes<HTMLButtonElement>；disabled、onClick、name/value、form、aria-* 等原生属性直接透传",
  ],
  materialPolicy: "inherit-parent-surface",
  materialNotes: "控件自身使用 tint/实色填充，不额外叠加 backdrop blur；与父玻璃壳共享光学层。",
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["button-basic", "button-loading"],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentSourceRecord;
