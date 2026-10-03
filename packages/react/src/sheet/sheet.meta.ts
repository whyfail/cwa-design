import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const sheetMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "sheet",
  name: "Sheet",
  description: "bottom/end 单展开位抽屉；可拖拽关闭并提供关闭按钮作为替代。",
  typeName: "SheetProps",
  sourceTypePath: "packages/react/src/sheet/sheet.tsx#SheetProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Sheet"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {
    open: {
      type: "boolean",
    },
    defaultOpen: {
      type: "boolean",
      default: false,
    },
    onOpenChange: {
      type: "function",
      summary: "(open: boolean) => void",
    },
    placement: {
      type: "enum",
      values: ["bottom", "end"],
      default: "bottom",
    },
    children: {
      type: "node",
      summary: "ReactNode；内容由调用方提供",
      required: false,
    },
  },
  extends: [],
  materialPolicy: "glass-thick",
  materialNotes:
    "材质属于 Sheet.Content；默认 glass-thick。当前单展开位，无 snapPoints API；Provider solid/系统回退优先。",
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["sheet-basic"],
  runtimeDependencies: ["@base-ui/react", "motion"],
  deprecated: false,
  compoundParts: {
    "Sheet.Trigger": {
      exportName: "Sheet.Trigger",
      typeName: "DialogTriggerProps",
      sourceTypePath: "@base-ui/react/dialog#DialogTriggerProps",
      description: "Base UI Dialog Trigger 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogTriggerProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Sheet.Close": {
      exportName: "Sheet.Close",
      typeName: "DialogCloseProps",
      sourceTypePath: "@base-ui/react/dialog#DialogCloseProps",
      description: "Base UI Dialog Close 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogCloseProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Sheet.Title": {
      exportName: "Sheet.Title",
      typeName: "DialogTitleProps",
      sourceTypePath: "@base-ui/react/dialog#DialogTitleProps",
      description: "Base UI Dialog Title 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogTitleProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Sheet.Description": {
      exportName: "Sheet.Description",
      typeName: "DialogDescriptionProps",
      sourceTypePath: "@base-ui/react/dialog#DialogDescriptionProps",
      description: "Base UI Dialog Description 类型；CWA 可附加默认样式类。",
      props: {},
      extends: [
        "@base-ui/react/dialog#DialogDescriptionProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Sheet.Content": {
      exportName: "Sheet.Content",
      typeName: "SheetContentProps",
      sourceTypePath: "packages/react/src/sheet/sheet.tsx#SheetContentProps",
      description: "Sheet 的主题化 Portal/Popup 组合；材质只写在此部件。",
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
        dismissThreshold: {
          type: "number",
          description: "关闭拖动位移阈值（px）；不代表 snap point",
          default: 96,
        },
      },
      extends: [],
      materialPolicy: "glass-thick",
      materialNotes:
        "材质属于 Sheet.Content；默认 glass-thick。当前单展开位，无 snapPoints API；Provider solid/系统回退优先。",
    },
  },
} satisfies ComponentSourceRecord;
