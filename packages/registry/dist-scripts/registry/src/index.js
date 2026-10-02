// CWA Design Registry schema（T05）。
// 字段为拟定契约，随 T07+ 组件切片演进；冻结点在 T24（P0 全量 manifest 构建）。
import { z } from "zod";
export const RegistryErrorCode = {
    VERSION_NOT_FOUND: "VERSION_NOT_FOUND",
    COMPONENT_NOT_FOUND: "COMPONENT_NOT_FOUND",
    INVALID_INPUT: "INVALID_INPUT",
    UNSUPPORTED_FRAMEWORK: "UNSUPPORTED_FRAMEWORK",
    REGISTRY_UNAVAILABLE: "REGISTRY_UNAVAILABLE",
};
export class RegistryError extends Error {
    code;
    constructor(code, message) {
        super(`[${code}] ${message}`);
        this.code = code;
        this.name = "RegistryError";
    }
}
export const frameworkSchema = z.enum(["react"]);
/** 确切 SemVer 发行版（允许 alpha/beta prerelease，禁止范围）。 */
export const exactVersionSchema = z
    .string()
    .regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/, "必须是确切 SemVer");
export const propEnumSchema = z
    .strictObject({
    type: z.literal("enum"),
    values: z.array(z.string()).min(1),
    default: z.string().optional(),
    required: z.boolean().optional(),
})
    .refine((v) => v.default === undefined || v.values.includes(v.default), {
    error: "enum default 必须是 values 之一",
});
export const propStringSchema = z.strictObject({
    type: z.literal("string"),
    default: z.string().optional(),
    required: z.boolean().optional(),
});
export const propBooleanSchema = z.strictObject({
    type: z.literal("boolean"),
    default: z.boolean().optional(),
    required: z.boolean().optional(),
});
export const propNumberSchema = z.strictObject({
    type: z.literal("number"),
    default: z.number().optional(),
    required: z.boolean().optional(),
});
/** children/ref/回调等不可完整序列化的类型：只记录类型摘要，指向 TS 声明。 */
export const propOpaqueSchema = z.strictObject({
    type: z.enum(["node", "ref", "function", "element", "record"]),
    summary: z.string(),
});
export const propSchema = z.union([
    propEnumSchema,
    propStringSchema,
    propBooleanSchema,
    propNumberSchema,
    propOpaqueSchema,
]);
export const componentRecordSchema = z.strictObject({
    schemaVersion: z.string(),
    libraryVersion: exactVersionSchema,
    framework: frameworkSchema,
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    name: z.string().min(1),
    status: z.enum(["draft", "stable-in-alpha", "deprecated"]),
    package: z.string(),
    exports: z.array(z.string()).min(1),
    importPath: z.string(),
    stylePath: z.string(),
    props: z.record(z.string(), propSchema),
    /** 继承的原生属性白名单（完整 TS 类型仍是权威）。 */
    extends: z.array(z.string()).default([]),
    materialPolicy: z.enum([
        "inherit-parent-surface",
        "glass-regular",
        "glass-thick",
        "glass-clear-opt-in",
        "solid",
        "frosted",
    ]),
    a11y: z.array(z.string()).min(1),
    examples: z.array(z.string()).default([]),
    runtimeDependencies: z.array(z.string()).default([]),
    deprecated: z.boolean().default(false),
});
export const exampleRecordSchema = z.strictObject({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    componentId: z.string(),
    framework: frameworkSchema,
    title: z.string(),
    /** 编译验证结果由 examples:check 回填；未验证为 null。 */
    compiled: z.boolean().nullable(),
    imports: z.array(z.string()),
    needsStyles: z.boolean(),
    contentDigest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
});
export const recipeRecordSchema = z.strictObject({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    framework: frameworkSchema,
    title: z.string(),
    components: z.array(z.string()).min(1),
    files: z.array(z.string()).min(1),
});
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
});
/** 按确切版本取 manifest；未命中抛 VERSION_NOT_FOUND，绝不静默换成新版本。 */
export function getManifest(manifests, framework, version) {
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
        throw new RegistryError("VERSION_NOT_FOUND", available.length > 0
            ? `版本 ${version} 不存在；可用版本：${available.join(", ")}`
            : `版本 ${version} 不存在`);
    }
    return found;
}
/** 按组件 id 取记录；未命中抛 COMPONENT_NOT_FOUND。 */
export function getComponent(manifest, id) {
    const found = manifest.components.find((c) => c.id === id);
    if (!found) {
        throw new RegistryError("COMPONENT_NOT_FOUND", `组件 "${id}" 不存在于 ${manifest.framework}@${manifest.libraryVersion}`);
    }
    return found;
}
