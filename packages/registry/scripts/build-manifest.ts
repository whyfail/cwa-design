// T24：P0 manifest 构建器。
// 输入：scripts/component-metas.ts（静态导入 30 个 meta，类型安全）+ react src 示例目录。
// 输出：packages/registry/dist/manifest/react/<version>/manifest.json（immutable artifact）。
// 校验失败（schema、示例编译、digest 回读）即构建失败。
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exampleRecordSchema, manifestSchema, type ComponentRecord } from "../src/index.js";


// 编译产物位于 dist-scripts/registry/scripts/（rootDir=packages），
// 三级 ".." 到 monorepo 根：scripts → registry → packages → 根。
// 以运行时 monorepo 标记文件兜底校验，防未来目录调整后静默错位。
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
if (!existsSync(path.join(repoRoot, "pnpm-workspace.yaml"))) {
  throw new Error(`repoRoot 解析错误: ${repoRoot} 缺少 pnpm-workspace.yaml`);
}
const reactSrc = path.join(repoRoot, "packages", "react", "src");
const registryDist = path.join(repoRoot, "packages", "registry", "dist");
const LIBRARY_VERSION = "0.1.0-alpha.0";
const SCHEMA_VERSION = "1.0.0";

function sha256File(file: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`;
}

function collectExamples(components: Array<ComponentRecord>): Array<{ record: ReturnType<typeof exampleRecordSchema.parse>; file: string }> {
  const out: Array<{ record: ReturnType<typeof exampleRecordSchema.parse>; file: string }> = [];
  for (const meta of components) {
    const examplesDir = path.join(reactSrc, meta.id, "examples");
    let entries: string[];
    try {
      entries = readdirSync(examplesDir).filter((f) => f.endsWith(".tsx"));
    } catch {
      continue;
    }
    for (const entry of entries) {
      const file = path.join(examplesDir, entry);
      const id = entry.replace(/\.tsx$/, "");
      const source = readFileSync(file, "utf8");
      const imports = [...source.matchAll(/from "([^"]+)"/g)].map((m) => m[1]!);
      out.push({
        file,
        record: exampleRecordSchema.parse({
          id,
          componentId: meta.id,
          framework: "react",
          title: `${meta.id} · ${id}`,
          compiled: null, // 编译验证由下方 tsc 步骤回填
          imports,
          needsStyles: source.includes("styles.css"),
          contentDigest: sha256File(file),
        }),
      });
    }
  }
  return out;
}

// 每个示例用 TS7 tsc --noEmit 实际编译（.bin 是 shell shim，直接调 node + 真实入口）。
function compileExamples(files: string[]): void {
  const tscBin = path.join(repoRoot, "node_modules", "@typescript", "native", "bin", "tsc");
  try {
    const out = execFileSync(
      process.execPath,
      [
        tscBin,
        "--noEmit",
        "--jsx",
        "react-jsx",
        "--strict",
        "--moduleResolution",
        "bundler",
        "--module",
        "esnext",
        "--target",
        "es2022",
        "--skipLibCheck",
        "--esModuleInterop",
        ...files,
      ],
      { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if (out.trim()) throw new Error(`意外编译输出: ${out}`);
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; status?: number };
    const detail = [err.stdout, err.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`示例编译失败 (exit ${err.status}): ${detail || String(error)}`, { cause: error });
  }
}

export function buildManifest(): { manifestPath: string; digest: string; components: number; examples: number } {
  const metasPath = path.join(repoRoot, "packages", "react", "dist", "metas.json");
  const components = JSON.parse(readFileSync(metasPath, "utf8")) as Array<ComponentRecord>;
  if (components.length !== 30) {
    throw new Error(`metas.json 应含 30 个组件，实际 ${components.length}`);
  }
  const examples = collectExamples(components);

  try {
    compileExamples(examples.map((e) => e.file));
    for (const e of examples) (e.record as { compiled: boolean }).compiled = true;
  } catch (error) {
    throw new Error(`examples:check 失败: ${(error as Error).message}`, { cause: error });
  }

  const manifestBody = {
    schemaVersion: SCHEMA_VERSION,
    libraryVersion: LIBRARY_VERSION,
    framework: "react",
    registryDigest: "pending",
    generatedAt: new Date().toISOString(),
    components,
    examples: examples.map((e) => e.record),
    recipes: [],
  };

  // manifest 不含自身 digest 条目：序列化（digest 置空）→ 计算 → 回填。
  const withoutDigest = JSON.stringify({ ...manifestBody, registryDigest: "" }, null, 2);
  const digest = `sha256:${createHash("sha256").update(withoutDigest).digest("hex")}`;
  const final = withoutDigest.replace('"registryDigest": ""', `"registryDigest": "${digest}"`);

  const versionDir = path.join(registryDist, "manifest", "react", LIBRARY_VERSION);
  rmSync(path.join(registryDist, "manifest"), { recursive: true, force: true });
  mkdirSync(versionDir, { recursive: true });
  const manifestPath = path.join(versionDir, "manifest.json");
  writeFileSync(manifestPath, `${final}\n`);

  // 回读校验：digest 与字节一致、schema 通过。
  const reparsed = JSON.parse(readFileSync(manifestPath, "utf8")) as { registryDigest: string };
  const actual = `sha256:${
    createHash("sha256")
      .update(JSON.stringify({ ...reparsed, registryDigest: "" }, null, 2))
      .digest("hex")
  }`;
  if (reparsed.registryDigest !== actual) {
    throw new Error(`digest 不一致: manifest=${reparsed.registryDigest} actual=${actual}`);
  }
  manifestSchema.parse(reparsed);
  return { manifestPath, digest, components: components.length, examples: examples.length };
}

const isMain = process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const result = buildManifest();
  console.log(
    `manifest: ${result.components} components, ${result.examples} examples (compiled), digest=${result.digest}`,
  );
  console.log(`artifact: ${result.manifestPath}`);
}
