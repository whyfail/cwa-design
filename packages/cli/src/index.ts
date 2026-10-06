#!/usr/bin/env node
// CWA Design CLI（T26 只读命令 + T27 init 写入）。apply 类写入仅限显式 --apply。
// 原则：无隐式写入；--json 输出机器可读数据；数据按确切版本查询。
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  type ComponentRecord,
  getComponent,
  getManifest,
  RegistryError,
} from "@cwa-design/registry";
import {
  currentLibraryVersion,
  loadSnapshots,
  type RegistrySnapshot,
  readArtifact,
} from "@cwa-design/registry/snapshot";
import { applyInit, planInit } from "./init.js";

interface CliContext {
  snapshots: RegistrySnapshot[];
  libraryVersion: string;
}

function loadContext(): CliContext {
  const snapshots = loadSnapshots();
  const libraryVersion = currentLibraryVersion();
  getManifest(
    snapshots.map((snapshot) => snapshot.manifest),
    "react",
    libraryVersion,
  );
  return { snapshots, libraryVersion };
}

function fail(code: string, message: string): never {
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ ok: false, error: { code, message } }, null, 2));
  } else {
    console.error(`[${code}] ${message}`);
  }
  process.exit(1);
}

function detectProject(cwd: string): { framework: string | null; packageManager: string | null } {
  const pkgPath = path.join(cwd, "package.json");
  if (!existsSync(pkgPath)) return { framework: null, packageManager: null };
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    packageManager?: string;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const framework = deps["@cwa-design/react"] ? "react" : null;
  const packageManager =
    pkg.packageManager?.split("@")[0] ??
    (existsSync(path.join(cwd, "pnpm-lock.yaml")) ? "pnpm" : null);
  return { framework, packageManager };
}

function printRecord(record: ComponentRecord, json: boolean): void {
  if (json) {
    console.log(JSON.stringify({ ok: true, data: record }, null, 2));
    return;
  }
  console.log(`${record.name} (${record.id}) · ${record.status}`);
  console.log(`import: ${record.importPath} → { ${record.exports.join(", ")} }`);
  console.log(`styles: ${record.stylePath}`);
  console.log(`material: ${record.materialPolicy}`);
  console.log(`a11y: ${record.a11y.join(", ")}`);
  if (Object.keys(record.props).length > 0) {
    console.log("props:");
    for (const [name, prop] of Object.entries(record.props)) {
      const detail = prop.type === "enum" ? `enum ${prop.values.join("|")}` : prop.type;
      console.log(
        `  ${name}: ${detail}${"default" in prop && prop.default !== undefined ? ` = ${JSON.stringify(prop.default)}` : ""}`,
      );
    }
  }
  if (record.examples.length > 0) console.log(`examples: ${record.examples.join(", ")}`);
}

function main(): void {
  const [command, ...args] = process.argv.slice(2);
  const json = process.argv.includes("--json");
  const ctx = loadContext();
  const versionArg = args.find((arg) => arg.startsWith("--version="));
  const version = versionArg ? versionArg.slice("--version=".length) : ctx.libraryVersion;
  const manifest = getManifest(
    ctx.snapshots.map((snapshot) => snapshot.manifest),
    "react",
    version,
  );
  const snapshot = ctx.snapshots.find((entry) => entry.manifest === manifest)!;

  switch (command) {
    case "doctor": {
      const cwd = process.cwd();
      const project = detectProject(cwd);
      const report = {
        ok: true,
        cliVersion: ctx.libraryVersion,
        node: process.version,
        cwd,
        framework: project.framework,
        packageManager: project.packageManager,
        registryVersions: ctx.snapshots.map(
          ({ manifest: entry }) => `${entry.framework}@${entry.libraryVersion}`,
        ),
        selectedVersion: version,
        registryDigest: manifest.registryDigest,
        checks: [
          {
            name: "node-lts",
            pass: process.version.startsWith("v24.") || process.version.startsWith("v22."),
          },
          { name: "cwa-react-installed", pass: project.framework === "react" },
        ],
      };
      if (json) console.log(JSON.stringify(report, null, 2));
      else {
        console.log(`CWA Design doctor`);
        console.log(`  CLI/registry: ${ctx.libraryVersion}`);
        console.log(`  Node: ${process.version}`);
        console.log(`  项目框架: ${project.framework ?? "未安装 @cwa-design/react"}`);
        console.log(`  包管理器: ${project.packageManager ?? "未知"}`);
        for (const check of report.checks)
          console.log(`  [${check.pass ? "✓" : "✗"}] ${check.name}`);
      }
      break;
    }

    case "search": {
      const query = (args.find((a) => !a.startsWith("--")) ?? "").toLowerCase();
      const limitArg = args.find((a) => a.startsWith("--limit="));
      const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;
      if (!Number.isInteger(limit) || limit < 1 || limit > 50)
        fail("INVALID_INPUT", "--limit 必须是 1–50 的整数。");
      const hits = manifest.components.filter(
        (c) =>
          query === "" ||
          c.id.includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.a11y.some((a) => a.includes(query)) ||
          c.materialPolicy.includes(query),
      );
      const results = hits.slice(0, Math.max(1, Math.min(50, limit))).map((c) => ({
        id: c.id,
        name: c.name,
        summary: `${c.status} · ${c.materialPolicy}`,
      }));
      if (json)
        console.log(
          JSON.stringify(
            { ok: true, libraryVersion: version, query, results, total: hits.length },
            null,
            2,
          ),
        );
      else {
        console.log(`search "${query}" → ${hits.length} hits (showing ${results.length})`);
        for (const r of results) console.log(`  ${r.id.padEnd(20)} ${r.summary}`);
      }
      break;
    }

    case "inspect": {
      const id = args.find((a) => !a.startsWith("--"));
      if (!id) fail("INVALID_INPUT", "用法: cwa-design inspect <component-id> [--version=x.y.z]");
      try {
        printRecord(getComponent(manifest, id), json);
      } catch (error) {
        if (error instanceof RegistryError) fail(error.code, error.message);
        throw error;
      }
      break;
    }

    case "init": {
      const apply = process.argv.includes("--apply");
      try {
        const plan = apply ? applyInit(process.cwd(), version) : planInit(process.cwd(), version);
        if (json) {
          console.log(
            JSON.stringify(
              { ok: true, applied: apply, action: plan.action, file: plan.file, diff: plan.diff },
              null,
              2,
            ),
          );
        } else {
          console.log(`init（${apply ? "已写入" : "dry-run，--apply 写入"}）：${plan.action}`);
          for (const line of plan.diff) console.log(`  ${line}`);
          if (plan.action === "up-to-date") console.log("  已是最新，无变更");
        }
      } catch (error) {
        if (error instanceof RegistryError) fail(error.code, error.message);
        throw error;
      }
      break;
    }

    case "plan": {
      const ids = args.filter((a) => !a.startsWith("--"));
      if (ids.length === 0)
        fail("INVALID_INPUT", "用法: cwa-design plan <component-id...> [--version=x.y.z]");
      try {
        const records = ids.map((id) => getComponent(manifest, id));
        const plan = {
          ok: true,
          version,
          install: {
            packages: [`@cwa-design/react@${version}`],
            command: `pnpm add @cwa-design/react@${version}`,
            publicationStatus: "not-verified",
            commandRequiresPublishedVersion: true,
          },
          styles: { import: "@cwa-design/react/styles.css", note: "入口引入一次；含 tokens" },
          provider: {
            component: "CwaProvider",
            props: { theme: "system", material: "auto", motion: "system", locale: "zh-CN" },
          },
          components: records.map((r) => ({
            id: r.id,
            exports: r.exports,
            importPath: r.importPath,
            materialPolicy: r.materialPolicy,
            a11y: r.a11y,
          })),
          warnings: [
            "plan 仅输出可审查步骤，不写入工程（apply 为 T27 独立命令）",
            "命令为建议值，实际以项目包管理器为准",
            "本地 Registry 不证明 npm 已发布；候选版请使用源码构建或审核后的本地 tarball。发布状态核验前不要执行该 npm 命令。",
          ],
        };
        if (json) console.log(JSON.stringify(plan, null, 2));
        else {
          console.log(`安装计划 @ ${version}`);
          console.log(`  1. ${plan.install.command}`);
          console.log(`  2. import "${plan.styles.import}"`);
          console.log(`  3. 以 <CwaProvider> 包裹应用根`);
          for (const c of plan.components)
            console.log(`  · ${c.id}: { ${c.exports.join(", ")} } ← ${c.importPath}`);
        }
      } catch (error) {
        if (error instanceof RegistryError) fail(error.code, error.message);
        throw error;
      }
      break;
    }

    case "example": {
      const id = args.find((arg) => !arg.startsWith("--"));
      const example = manifest.examples.find((entry) => entry.id === id);
      if (!example)
        throw new RegistryError("EXAMPLE_NOT_FOUND", `示例 ${id ?? ""} 不存在于 ${version}。`);
      if (!example.file)
        throw new RegistryError("REGISTRY_UNAVAILABLE", `版本 ${version} 没有该示例源码快照。`);
      const artifact = readArtifact(snapshot, example.file);
      if (artifact.record.contentDigest !== example.contentDigest)
        throw new RegistryError("REGISTRY_UNAVAILABLE", "示例与源码 digest 不一致。");
      if (json)
        console.log(
          JSON.stringify(
            {
              ok: true,
              libraryVersion: version,
              data: { ...example, source: artifact.content, artifact: artifact.record },
            },
            null,
            2,
          ),
        );
      else console.log(artifact.content);
      break;
    }

    case "tokens": {
      if (!manifest.tokensFile)
        throw new RegistryError(
          "REGISTRY_UNAVAILABLE",
          `版本 ${version} 没有 Token 快照；不能借用当前版本。`,
        );
      const artifact = readArtifact(snapshot, manifest.tokensFile);
      const tokens = JSON.parse(artifact.content) as { libraryVersion: string };
      if (tokens.libraryVersion !== version)
        throw new RegistryError("REGISTRY_UNAVAILABLE", "Token 与 Registry 版本不一致。");
      if (json)
        console.log(
          JSON.stringify(
            { ok: true, libraryVersion: version, data: tokens, artifact: artifact.record },
            null,
            2,
          ),
        );
      else console.log(artifact.content);
      break;
    }

    case "recipe": {
      const id = args.find((arg) => !arg.startsWith("--"));
      const recipe = manifest.recipes.find((entry) => entry.id === id);
      if (!recipe)
        throw new RegistryError("RECIPE_NOT_FOUND", `配方 ${id ?? ""} 不存在于 ${version}。`);
      const sources = recipe.files.map((file) => {
        const artifact = readArtifact(snapshot, file);
        return { file, source: artifact.content, artifact: artifact.record };
      });
      if (json)
        console.log(
          JSON.stringify(
            { ok: true, libraryVersion: version, data: { ...recipe, sources } },
            null,
            2,
          ),
        );
      else for (const source of sources) console.log(`${source.file}\n${source.source}`);
      break;
    }

    case "--help":
    case "help":
    case undefined: {
      console.log(`cwa-design <command>

  doctor                    环境与项目诊断（只读）
  search [query]            搜索组件（--limit=N, --json）
  inspect <id>              组件契约详情（--version=x.y.z, --json）
  plan <id...>              生成安装计划（不写入，--json）
  example <id>              读取确切版本的真实示例源码（--json）
  tokens                    读取确切版本的 Token JSON（--json）
  recipe <id>               读取配方源码与业务接入限制（--json）
  init [--apply]            生成/合并 cwa-design.json（默认 dry-run）
  help                      本帮助

数据来自本地 registry 快照（版本 ${ctx.libraryVersion}）；apply 写入命令另行提供。`);
      break;
    }

    default:
      fail("INVALID_INPUT", `未知命令 "${command}"；用 cwa-design help 查看用法`);
  }
}

try {
  main();
} catch (error) {
  if (error instanceof RegistryError) fail(error.code, error.message);
  throw error;
}
