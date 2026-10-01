import { describe, expect, it } from "vitest";
import {
  componentRecordSchema,
  getComponent,
  getManifest,
  RegistryError,
  type RegistryManifest,
} from "../src/index.js";

const buttonRecord = {
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
    children: { type: "node", summary: "按钮内容" },
  },
  extends: ["native-button-attributes"],
  materialPolicy: "inherit-parent-surface",
  a11y: ["native-button", "visible-focus", "name-required"],
  examples: [],
  runtimeDependencies: [],
  deprecated: false,
};

const manifest: RegistryManifest = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  registryDigest: `sha256:${"a".repeat(64)}`,
  generatedAt: "2026-10-02T00:00:00.000Z",
  components: [componentRecordSchema.parse(buttonRecord)],
  examples: [],
  recipes: [],
};

describe("registry", () => {
  it("接受完整 button 记录", () => {
    expect(manifest.components).toHaveLength(1);
    expect(manifest.components[0]!.id).toBe("button");
  });

  it("拒绝不存在的 prop 枚举值（default 不在 values 中）", () => {
    const bad = {
      ...buttonRecord,
      props: {
        ...buttonRecord.props,
        variant: { type: "enum", values: ["primary"], default: "ghost" },
      },
    };
    expect(componentRecordSchema.safeParse(bad).success).toBe(false);
  });

  it("拒绝 unknown 字段", () => {
    expect(componentRecordSchema.safeParse({ ...buttonRecord, unknownField: true }).success).toBe(
      false,
    );
  });

  it("拒绝非确切 SemVer 版本（范围/latest）", () => {
    expect(
      componentRecordSchema.safeParse({ ...buttonRecord, libraryVersion: "^0.1.0" }).success,
    ).toBe(false);
    expect(
      componentRecordSchema.safeParse({ ...buttonRecord, libraryVersion: "latest" }).success,
    ).toBe(false);
  });

  it("未命中版本抛 VERSION_NOT_FOUND 且不静默换新版本", () => {
    expect(() => getManifest([manifest], "react", "0.9.9")).toThrow(RegistryError);
    try {
      getManifest([manifest], "react", "0.9.9");
    } catch (error) {
      expect((error as RegistryError).code).toBe("VERSION_NOT_FOUND");
    }
  });

  it("未知框架抛 UNSUPPORTED_FRAMEWORK，未知组件抛 COMPONENT_NOT_FOUND", () => {
    // @ts-expect-error 故意的非法框架
    expect(() => getManifest([manifest], "vue", "0.1.0-alpha.0")).toThrow(RegistryError);
    expect(() => getComponent(manifest, "dialog")).toThrow(RegistryError);
  });
});
