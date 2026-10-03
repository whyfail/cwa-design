// Component source contracts are versioned by the registry builder, never by hand.
import { z } from "zod";

export const REGISTRY_SCHEMA_VERSION = "1.1.0";

export const RegistryErrorCode = {
  VERSION_NOT_FOUND: "VERSION_NOT_FOUND",
  COMPONENT_NOT_FOUND: "COMPONENT_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  UNSUPPORTED_FRAMEWORK: "UNSUPPORTED_FRAMEWORK",
  REGISTRY_UNAVAILABLE: "REGISTRY_UNAVAILABLE",
  EXAMPLE_NOT_FOUND: "EXAMPLE_NOT_FOUND",
  RECIPE_NOT_FOUND: "RECIPE_NOT_FOUND",
  MIGRATION_NOT_FOUND: "MIGRATION_NOT_FOUND",
} as const;
export type RegistryErrorCode = (typeof RegistryErrorCode)[keyof typeof RegistryErrorCode];

export class RegistryError extends Error {
  constructor(
    public readonly code: RegistryErrorCode,
    message: string,
  ) {
    super(`[${code}] ${message}`);
    this.name = "RegistryError";
  }
}

export const frameworkSchema = z.enum(["react"]);
export type Framework = z.infer<typeof frameworkSchema>;

/** 确切 SemVer 发行版（允许 alpha/beta prerelease，禁止范围）。 */
export const exactVersionSchema = z
  .string()
  .max(128)
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/, "必须是确切 SemVer")
  .refine((value) => !value.split("+")[0]!.split("-").slice(1).join("-").split(".").some((part) => /^0\d+$/.test(part)), "SemVer 数字 prerelease 不能有前导零");

const propInfo = {
  required: z.boolean().optional(),
  description: z.string().optional(),
  defaultSummary: z.string().optional(),
  origin: z.enum(["own", "inherited"]).optional(),
};

export const propEnumSchema = z
  .strictObject({
    type: z.literal("enum"),
    values: z.array(z.union([z.string(), z.number()])).min(1),
    default: z.union([z.string(), z.number()]).optional(),
    ...propInfo,
  })
  .refine((v) => v.default === undefined || v.values.includes(v.default), {
    error: "enum default 必须是 values 之一",
  });
export const propStringSchema = z.strictObject({
  type: z.literal("string"),
  default: z.string().optional(),
  ...propInfo,
});
export const propBooleanSchema = z.strictObject({
  type: z.literal("boolean"),
  default: z.boolean().optional(),
  ...propInfo,
});
export const propNumberSchema = z.strictObject({
  type: z.literal("number"),
  default: z.number().optional(),
  ...propInfo,
});
/** children/ref/回调等不可完整序列化的类型：只记录类型摘要，指向 TS 声明。 */
export const propOpaqueSchema = z.strictObject({
  type: z.enum(["node", "ref", "function", "element", "record", "array", "union"]),
  summary: z.string(),
  ...propInfo,
});

export const propStringNumberSchema = z.strictObject({
  type: z.literal("string-number"),
  default: z.union([z.string(), z.number()]).optional(),
  ...propInfo,
});

export const propSchema = z.union([
  propEnumSchema,
  propStringSchema,
  propBooleanSchema,
  propNumberSchema,
  propOpaqueSchema,
  propStringNumberSchema,
]);
export type PropRecord = z.infer<typeof propSchema>;

export const materialPolicySchema = z.enum([
  "inherit-parent-surface", "glass-regular", "glass-thick", "glass-clear-opt-in", "solid", "frosted",
]);

export const compoundPartSchema = z.strictObject({
  exportName: z.string(),
  typeName: z.string(),
  sourceTypePath: z.string(),
  description: z.string(),
  props: z.record(z.string(), propSchema),
  extends: z.array(z.string()),
  materialPolicy: materialPolicySchema.optional(),
  materialNotes: z.string().optional(),
});

export const componentRecordSchema = z.strictObject({
  schemaVersion: z.string(),
  libraryVersion: exactVersionSchema,
  framework: frameworkSchema,
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  description: z.string().optional(),
  typeName: z.string().optional(),
  sourceTypePath: z.string().optional(),
  status: z.enum(["draft", "stable-in-alpha", "deprecated"]),
  package: z.string(),
  exports: z.array(z.string()).min(1),
  importPath: z.string(),
  stylePath: z.string(),
  props: z.record(z.string(), propSchema),
  /** Exact inherited TS types; this is not an invented prop whitelist. */
  extends: z.array(z.string()).default([]),
  compoundParts: z.record(z.string(), compoundPartSchema).optional(),
  materialPolicy: materialPolicySchema,
  materialNotes: z.string().optional(),
  a11y: z.array(z.string()).min(1),
  examples: z.array(z.string()).default([]),
  runtimeDependencies: z.array(z.string()).default([]),
  deprecated: z.boolean().default(false),
});
export type ComponentRecord = z.infer<typeof componentRecordSchema>;
export type ComponentSourceRecord = Omit<ComponentRecord, "libraryVersion">;

export const relativeArtifactPathSchema = z.string().regex(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/);
export const contentDigestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);
export const artifactRecordSchema = z.strictObject({
  path: relativeArtifactPathSchema,
  mimeType: z.string(),
  contentDigest: contentDigestSchema,
  byteSize: z.number().int().nonnegative(),
  sourcePath: relativeArtifactPathSchema.optional(),
  sourceDigest: contentDigestSchema.optional(),
});
export type ArtifactRecord = z.infer<typeof artifactRecordSchema>;

export const exampleRecordSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  componentId: z.string(),
  framework: frameworkSchema,
  title: z.string(),
  /** 编译验证结果由 examples:check 回填；未验证为 null。 */
  compiled: z.boolean().nullable(),
  imports: z.array(z.string()),
  needsStyles: z.boolean(),
  contentDigest: contentDigestSchema,
  sourcePath: relativeArtifactPathSchema.optional(),
  file: relativeArtifactPathSchema.optional(),
  exportName: z.string().optional(),
  requiresProvider: z.boolean().optional(),
});
export type ExampleRecord = z.infer<typeof exampleRecordSchema>;

export const recipeRecordSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  framework: frameworkSchema,
  title: z.string(),
  components: z.array(z.string()).min(1),
  files: z.array(z.string()).min(1),
  sourcePath: relativeArtifactPathSchema.optional(),
  exportName: z.string().optional(),
  compiled: z.boolean().nullable().optional(),
  limitations: z.array(z.string()).optional(),
});
export type RecipeRecord = z.infer<typeof recipeRecordSchema>;

/** Registry envelope：schemaVersion（数据格式）与 libraryVersion（发行版本）分开，不得合并。 */
export const manifestSchema = z.strictObject({
  schemaVersion: z.string(),
  libraryVersion: exactVersionSchema,
  framework: frameworkSchema,
  registryDigest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  generatedAt: z.string().datetime(),
  components: z.array(componentRecordSchema),
  examples: z.array(exampleRecordSchema).default([]),
  recipes: z.array(recipeRecordSchema).default([]),
  artifacts: z.array(artifactRecordSchema).optional(),
  tokensFile: relativeArtifactPathSchema.optional(),
  digestMethod: z.literal("sha256-json-2-space-empty-registryDigest").optional(),
});
export type RegistryManifest = z.infer<typeof manifestSchema>;

/** 按确切版本取 manifest；未命中抛 VERSION_NOT_FOUND，绝不静默换成新版本。 */
export function getManifest(
  manifests: RegistryManifest[],
  framework: Framework,
  version: string,
): RegistryManifest {
  if (!frameworkSchema.safeParse(framework).success) {
    throw new RegistryError("UNSUPPORTED_FRAMEWORK", `framework "${framework}" 不受支持`);
  }
  if (!exactVersionSchema.safeParse(version).success) {
    throw new RegistryError("INVALID_INPUT", `version "${version}" 不是确切 SemVer`);
  }
  const found = manifests.find((m) => m.framework === framework && m.libraryVersion === version);
  if (!found) {
    const available = manifests
      .filter((m) => m.framework === framework)
      .map((m) => m.libraryVersion);
    throw new RegistryError(
      "VERSION_NOT_FOUND",
      available.length > 0
        ? `版本 ${version} 不存在；可用版本：${available.join(", ")}`
        : `版本 ${version} 不存在`,
    );
  }
  return found;
}

/** 按组件 id 取记录；未命中抛 COMPONENT_NOT_FOUND。 */
export function getComponent(manifest: RegistryManifest, id: string): ComponentRecord {
  const found = manifest.components.find((c) => c.id === id);
  if (!found) {
    throw new RegistryError(
      "COMPONENT_NOT_FOUND",
      `组件 "${id}" 不存在于 ${manifest.framework}@${manifest.libraryVersion}`,
    );
  }
  return found;
}
