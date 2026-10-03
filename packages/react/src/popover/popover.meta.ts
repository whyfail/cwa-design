import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const popoverMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "popover",
  name: "Popover",
  description: "锚定的非模态浮层；焦点、外部点击与定位由 Base UI 管理。",
  typeName: "PopoverRootProps",
  sourceTypePath: "packages/react/src/popover/popover.tsx#PopoverRootProps",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Popover", "PopoverContent"],
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
    "@base-ui/react/popover#PopoverRootProps；open/defaultOpen/onOpenChange/modal 等完整继承",
  ],
  materialPolicy: "glass-regular",
  materialNotes:
    '默认 glass；Provider material="solid" 优先。实际玻璃背景重叠时使用 solid；系统减少透明、增强对比、forced-colors 或不支持 blur 时按公共材质规则降级。',
  a11y: [
    "semantic-content",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["popover-basic"],
  runtimeDependencies: ["@base-ui/react"],
  deprecated: false,
  compoundParts: {
    "Popover.Trigger": {
      exportName: "Popover.Trigger",
      typeName: "PopoverTriggerProps",
      sourceTypePath: "@base-ui/react/popover#PopoverTriggerProps",
      description: "Base UI Trigger 直接导出。",
      props: {},
      extends: [
        "@base-ui/react/popover#PopoverTriggerProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Popover.Close": {
      exportName: "Popover.Close",
      typeName: "PopoverCloseProps",
      sourceTypePath: "@base-ui/react/popover#PopoverCloseProps",
      description: "Base UI Close 直接导出。",
      props: {},
      extends: [
        "@base-ui/react/popover#PopoverCloseProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Popover.Title": {
      exportName: "Popover.Title",
      typeName: "PopoverTitleProps",
      sourceTypePath: "@base-ui/react/popover#PopoverTitleProps",
      description: "Base UI Title 直接导出。",
      props: {},
      extends: [
        "@base-ui/react/popover#PopoverTitleProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Popover.Description": {
      exportName: "Popover.Description",
      typeName: "PopoverDescriptionProps",
      sourceTypePath: "@base-ui/react/popover#PopoverDescriptionProps",
      description: "Base UI Description 直接导出。",
      props: {},
      extends: [
        "@base-ui/react/popover#PopoverDescriptionProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    PopoverContent: {
      exportName: "PopoverContent",
      typeName: "PopoverContentProps",
      sourceTypePath: "packages/react/src/popover/popover.tsx#PopoverContentProps",
      description: "CWA 主题化 Portal 和锚定 Popup。",
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
        "aria-label": {
          type: "string",
        },
        material: {
          type: "enum",
          values: ["glass", "solid"],
          default: "glass",
        },
      },
      extends: [],
      materialPolicy: "glass-regular",
      materialNotes:
        '默认 glass；Provider material="solid" 优先。实际玻璃背景重叠时使用 solid；系统减少透明、增强对比、forced-colors 或不支持 blur 时按公共材质规则降级。',
    },
  },
} satisfies ComponentSourceRecord;
