import type { ComponentSourceRecord } from "@cwa-design/registry";

// Own props and inherited TS types; release version is added from package.json by Registry.
export const selectMeta = {
  schemaVersion: "1.1.0",
  framework: "react",
  id: "select",
  name: "Select",
  description: "字符串值单选；选择值用 Select，动作菜单用 DropdownMenu。",
  typeName: "SelectRootPropsAlias",
  sourceTypePath: "packages/react/src/select/select.tsx#SelectRootPropsAlias",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Select", "SelectContent", "SelectItem"],
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
    "@base-ui/react/select#SelectRootProps<Value extends string>；value/defaultValue/onValueChange、open/defaultOpen/onOpenChange、name/items/disabled 等完整继承；Multiple 泛型固定为默认 false",
  ],
  materialPolicy: "glass-regular",
  materialNotes:
    '默认 glass；Provider material="solid" 优先。实际玻璃背景重叠时使用 solid；系统减少透明、增强对比、forced-colors 或不支持 blur 时按公共材质规则降级。',
  a11y: [
    "accessible-name-required-for-controls",
    "visible-focus-for-interactive-parts",
    "keyboard-behavior-from-native-or-base-ui",
  ],
  examples: ["select-basic"],
  runtimeDependencies: ["@base-ui/react"],
  deprecated: false,
  compoundParts: {
    "Select.Trigger": {
      exportName: "Select.Trigger",
      typeName: "SelectTriggerProps",
      sourceTypePath: "@base-ui/react/select#SelectTriggerProps",
      description:
        "默认样式的触发器：自动附加 cwa-design-select__trigger 类；children 未含 <Select.Icon> 时追加一个默认展开指示，已含自定义 Icon 时不追加（可关闭重复）；render 接管时由调用方负责；className（含函数）/ref 合并保留。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectTriggerProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.Value": {
      exportName: "Select.Value",
      typeName: "SelectValueProps",
      sourceTypePath: "@base-ui/react/select#SelectValueProps",
      description: "Base UI Value 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectValueProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.Icon": {
      exportName: "Select.Icon",
      typeName: "SelectIconProps",
      sourceTypePath: "@base-ui/react/select#SelectIconProps",
      description: "Base UI Icon 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectIconProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.Portal": {
      exportName: "Select.Portal",
      typeName: "SelectPortalProps",
      sourceTypePath: "@base-ui/react/select#SelectPortalProps",
      description: "Base UI Portal 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectPortalProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.Positioner": {
      exportName: "Select.Positioner",
      typeName: "SelectPositionerProps",
      sourceTypePath: "@base-ui/react/select#SelectPositionerProps",
      description: "Base UI Positioner 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectPositionerProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.Popup": {
      exportName: "Select.Popup",
      typeName: "SelectPopupProps",
      sourceTypePath: "@base-ui/react/select#SelectPopupProps",
      description: "Base UI Popup 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectPopupProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.List": {
      exportName: "Select.List",
      typeName: "SelectListProps",
      sourceTypePath: "@base-ui/react/select#SelectListProps",
      description: "Base UI List 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectListProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.Item": {
      exportName: "Select.Item",
      typeName: "SelectItemProps",
      sourceTypePath: "@base-ui/react/select#SelectItemProps",
      description: "Base UI Item 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectItemProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.ItemText": {
      exportName: "Select.ItemText",
      typeName: "SelectItemTextProps",
      sourceTypePath: "@base-ui/react/select#SelectItemTextProps",
      description: "Base UI ItemText 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectItemTextProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.ItemIndicator": {
      exportName: "Select.ItemIndicator",
      typeName: "SelectItemIndicatorProps",
      sourceTypePath: "@base-ui/react/select#SelectItemIndicatorProps",
      description: "Base UI ItemIndicator 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectItemIndicatorProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.Group": {
      exportName: "Select.Group",
      typeName: "SelectGroupProps",
      sourceTypePath: "@base-ui/react/select#SelectGroupProps",
      description: "Base UI Group 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectGroupProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    "Select.GroupLabel": {
      exportName: "Select.GroupLabel",
      typeName: "SelectGroupLabelProps",
      sourceTypePath: "@base-ui/react/select#SelectGroupLabelProps",
      description: "Base UI GroupLabel 的直接导出；未自动附加 CWA Content 组合样式。",
      props: {},
      extends: [
        "@base-ui/react/select#SelectGroupLabelProps；直接使用 Base UI 1.8.0 完整类型（含原生属性、render/ref）",
      ],
    },
    SelectContent: {
      exportName: "SelectContent",
      typeName: "SelectContentProps",
      sourceTypePath: "packages/react/src/select/select.tsx#SelectContentProps",
      description: "主题化 Portal、Positioner 与 Popup 的 CWA 组合。",
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
          values: ["glass", "solid"],
          default: "glass",
        },
      },
      extends: [],
      materialPolicy: "glass-regular",
      materialNotes:
        '默认 glass；Provider material="solid" 优先。实际玻璃背景重叠时使用 solid；系统减少透明、增强对比、forced-colors 或不支持 blur 时按公共材质规则降级。',
    },
    SelectItem: {
      exportName: "SelectItem",
      typeName: "SelectItemProps",
      sourceTypePath: "packages/react/src/select/select.tsx#SelectItemProps",
      description: "字符串单选项，包含文字与选中标记。",
      props: {
        value: {
          type: "string",
          required: true,
        },
        children: {
          type: "node",
          summary: "ReactNode；内容由调用方提供",
          required: false,
        },
        disabled: {
          type: "boolean",
        },
        className: {
          type: "string",
          description: "附加样式类；具体合并行为以实现为准",
        },
      },
      extends: [],
    },
  },
} satisfies ComponentSourceRecord;
