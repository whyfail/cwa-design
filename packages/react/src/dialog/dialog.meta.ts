import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const dialogMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "dialog",
  name: "Dialog",
  description: "模态对话框；焦点陷阱、Escape、滚动锁与恢复由 Base UI 管理。",
  typeName: "DialogRootProps",
  sourceTypePath: "packages/react/src/dialog/dialog.tsx#DialogRootProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Dialog"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    children: {
      type: "node",
      summary: "ReactNode；内容由调用方提供",
      required: false,
    },
  },
  extends: [
    "@base-ui/react/dialog#DialogRootProps；open/defaultOpen/onOpenChange/modal 等完整继承",
  ],
  materialPolicy: "glass-thick",
  materialNotes:
    "材质属于 Dialog.Content；默认 glass-thick，嵌套玻璃区域显式 solid。Provider solid 与系统回退优先。",
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["dialog-basic"],
  runtimeDependencies: ["@base-ui/react"],
  deprecated: false,
  compoundParts: {
    "Dialog.Trigger": {
      exportName: "Dialog.Trigger",
      typeName: "DialogTriggerProps",
      sourceTypePath: "@base-ui/react/dialog#DialogTriggerProps",
      description: "Base UI Dialog Trigger 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogTriggerProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Dialog.Close": {
      exportName: "Dialog.Close",
      typeName: "DialogCloseProps",
      sourceTypePath: "@base-ui/react/dialog#DialogCloseProps",
      description: "Base UI Dialog Close 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogCloseProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Dialog.Title": {
      exportName: "Dialog.Title",
      typeName: "DialogTitleProps",
      sourceTypePath: "@base-ui/react/dialog#DialogTitleProps",
      description: "Base UI Dialog Title 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogTitleProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Dialog.Description": {
      exportName: "Dialog.Description",
      typeName: "DialogDescriptionProps",
      sourceTypePath: "@base-ui/react/dialog#DialogDescriptionProps",
      description: "Base UI Dialog Description 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogDescriptionProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Dialog.Content": {
      exportName: "Dialog.Content",
      typeName: "DialogContentProps",
      sourceTypePath: "packages/react/src/dialog/dialog.tsx#DialogContentProps",
      description: "Dialog 的主题化 Portal/Popup 组合；材质只写在此部件。",
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
        material: {
          type: "enum",
          values: ["glass-thick", "solid"],
          default: "glass-thick",
        },
      },
      extends: [],
      materialPolicy: "glass-thick",
      materialNotes:
        "材质属于 Dialog.Content；默认 glass-thick，嵌套玻璃区域显式 solid。Provider solid 与系统回退优先。",
    },
  },
} satisfies ComponentSourceRecord;
