import type { ComponentRecord } from "@cwa-design/registry";

/**
 * Button 的 Registry 记录（T05 schema 校验的实例）。
 * 权威 API 仍是本包 TS 声明；此处记录语义/材质/a11y 约定。
 */
export const buttonMeta = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  id: "button",
  name: "Button",
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
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md" },
    loading: { type: "boolean", default: false },
    children: { type: "node", summary: "按钮内容；见 TS 声明 ButtonProps" },
    ref: { type: "ref", summary: "HTMLButtonElement" },
  },
  extends: ["native-button-attributes"],
  materialPolicy: "inherit-parent-surface",
  a11y: [
    "native-button",
    "visible-focus",
    "keyboard-enter-space",
    "aria-busy-loading",
    "44px-target-md",
  ],
  examples: ["button-basic", "button-loading"],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentRecord;
