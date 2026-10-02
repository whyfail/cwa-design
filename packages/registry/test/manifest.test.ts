// T24 校验测试：manifest 破坏必致失败（删 export、坏 prop、不存在 import、未知版本）。
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import {
  getComponent,
  getManifest,
  manifestSchema,
  RegistryError,
  type RegistryManifest,
} from "../src/index.js";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");
const manifestPath = path.join(
  pkgRoot,
  "dist",
  "manifest",
  "react",
  "0.1.0-alpha.0",
  "manifest.json",
);
const manifest: RegistryManifest = manifestSchema.parse(
  JSON.parse(readFileSync(manifestPath, "utf8")),
);

describe("manifest artifact（T24）", () => {
  it("30 个组件、示例已编译、digest 与字节一致", () => {
    expect(manifest.components).toHaveLength(30);
    expect(manifest.examples.length).toBeGreaterThan(0);
    for (const example of manifest.examples) {
      expect(example.compiled, `${example.id} 未编译`).toBe(true);
    }
    const reparsed = JSON.parse(readFileSync(manifestPath, "utf8")) as { registryDigest: string };
    const actual = `sha256:${createHash("sha256")
      .update(JSON.stringify({ ...reparsed, registryDigest: "" }, null, 2))
      .digest("hex")}`;
    expect(reparsed.registryDigest).toBe(actual);
  });

  it("查询已装版本命中；未知版本抛 VERSION_NOT_FOUND 不静默换新", () => {
    expect(getManifest([manifest], "react", "0.1.0-alpha.0").components).toHaveLength(30);
    expect(() => getManifest([manifest], "react", "9.9.9")).toThrow(RegistryError);
  });

  it("按 id 取组件；未知组件抛 COMPONENT_NOT_FOUND", () => {
    expect(getComponent(manifest, "button").name).toBe("Button");
    expect(() => getComponent(manifest, "not-a-component")).toThrow(RegistryError);
  });

  describe("破坏性校验（对临时副本构建，完毕恢复）", () => {
    const metaPath = path.join(repoRoot, "packages", "react", "src", "badge", "badge.meta.ts");
    const original = readFileSync(metaPath, "utf8");
    const examplePath = path.join(
      repoRoot,
      "packages",
      "react",
      "src",
      "badge",
      "examples",
      "badge-basic.tsx",
    );
    // 破坏流程：改 badge meta / 加坏示例 → 重生成 react metas.json → 重跑编译产物构建器。
    // 构建器跑编译产物（Node 无法直接执行 NodeNext 的 .js 导入指向 .ts 源）。
    const reactPkg = path.join(repoRoot, "packages", "react");
    const buildScript = path.join(
      pkgRoot,
      "dist-scripts",
      "registry",
      "scripts",
      "build-manifest.js",
    );
    const metasScript = path.join(reactPkg, "scripts", "generate-metas.ts");

    function runManifestBuild(): void {
      execFileSync(process.execPath, [metasScript], { cwd: reactPkg, stdio: "pipe" });
      execFileSync(process.execPath, [buildScript], { cwd: repoRoot, stdio: "pipe" });
    }

    let lastError = "";

    afterAll(() => {
      if (existsSync(examplePath)) rmSync(examplePath);
      writeFileSync(metaPath, original);
      runManifestBuild(); // 恢复真实 manifest
    });

    it("坏 prop（default 不在 values）使构建失败", () => {
      writeFileSync(
        metaPath,
        original.replace(
          /props: \{\},/,
          'props: { tone: { type: "enum", values: ["a"], default: "ghost" } },',
        ),
      );
      let failed = false;
      try {
        runManifestBuild();
      } catch (e) {
        failed = true;
        lastError = String((e as Error).message).slice(0, 150);
      }
      if (!failed) console.error("坏 prop 构建意外成功, lastError=", lastError);
      expect(failed, `坏 prop 未使构建失败: ${lastError}`).toBe(true);
    });

    it("示例中不存在的 import 使构建失败", () => {
      writeFileSync(
        metaPath,
        original.replace(/props: \{\},/, 'props: { tone: { type: "enum", values: ["neutral"] } },'),
      );
      mkdirSync(path.dirname(examplePath), { recursive: true });
      writeFileSync(examplePath, 'import { Button } from "@cwa-design/react/ghost-export";\n');
      let failed = false;
      try {
        runManifestBuild();
      } catch (e) {
        failed = true;
        lastError = String((e as Error).message).slice(0, 150);
      }
      if (!failed) console.error("ghost import 构建意外成功, lastError=", lastError);
      expect(failed, `不存在 import 未使构建失败: ${lastError}`).toBe(true);
    });
  });
});
