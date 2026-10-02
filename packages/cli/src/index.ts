#!/usr/bin/env node
// CWA Design CLI（T26：只读命令）。init/apply 写入命令在 T27 单独交付。
// 原则：无隐式写入；--json 输出机器可读数据；数据按确切版本查询。
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type ComponentRecord,
  getComponent,
  getManifest,
  RegistryError,
  type RegistryManifest,
} from "@cwa-design/registry";

interface CliContext {
  manifests: RegistryManifest[];
  libraryVersion: string;
}

function loadContext(): CliContext {
  // manifest 随 CLI 包携带（同版本批次发布，§19）。
  const manifestPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "node_modules",
    "@cwa-design/registry",
    "dist",
    "manifest",
    "react",
    "0.1.0-alpha.0",
    "manifest.json",
  );
  if (!existsSync(manifestPath)) {
    fail("REGISTRY_UNAVAILABLE", `本地 registry 快照缺失: ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as RegistryManifest;
  return { manifests: [manifest], libraryVersion: manifest.libraryVersion };
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
        registryVersions: ctx.manifests.map((m) => `${m.framework}@${m.libraryVersion}`),
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
      const manifest = ctx.manifests[0]!;
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
        console.log(JSON.stringify({ ok: true, query, results, total: hits.length }, null, 2));
      else {
        console.log(`search "${query}" → ${hits.length} hits (showing ${results.length})`);
        for (const r of results) console.log(`  ${r.id.padEnd(20)} ${r.summary}`);
      }
      break;
    }

    case "inspect": {
      const id = args.find((a) => !a.startsWith("--"));
      const versionArg = args.find((a) => a.startsWith("--version="));
      const version = versionArg ? versionArg.split("=")[1]! : ctx.libraryVersion;
      if (!id) fail("INVALID_INPUT", "用法: cwa-design inspect <component-id> [--version=x.y.z]");
      try {
        const manifest = getManifest(ctx.manifests, "react", version);
        printRecord(getComponent(manifest, id), json);
      } catch (error) {
        if (error instanceof RegistryError) fail(error.code, error.message);
        throw error;
      }
      break;
    }

    case "plan": {
      const ids = args.filter((a) => !a.startsWith("--"));
      const versionArg = args.find((a) => a.startsWith("--version="));
      const version = versionArg ? versionArg.split("=")[1]! : ctx.libraryVersion;
      if (ids.length === 0)
        fail("INVALID_INPUT", "用法: cwa-design plan <component-id...> [--version=x.y.z]");
      try {
        const manifest = getManifest(ctx.manifests, "react", version);
        const records = ids.map((id) => getComponent(manifest, id));
        const plan = {
          ok: true,
          version,
          install: {
            packages: ["@cwa-design/react"],
            command: "pnpm add @cwa-design/react",
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

    case "--help":
    case "help":
    case undefined: {
      console.log(`cwa-design <command>

  doctor                    环境与项目诊断（只读）
  search [query]            搜索组件（--limit=N, --json）
  inspect <id>              组件契约详情（--version=x.y.z, --json）
  plan <id...>              生成安装计划（不写入，--json）
  help                      本帮助

数据来自本地 registry 快照（版本 ${ctx.libraryVersion}）；apply 写入命令另行提供。`);
      break;
    }

    default:
      fail("INVALID_INPUT", `未知命令 "${command}"；用 cwa-design help 查看用法`);
  }
}

main();
