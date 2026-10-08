// F06：浏览器门禁统一入口——构建官网（部署同款 base）、启动静态服务、
// 依次运行 Chromium 核心门禁，失败即非零退出。QA 依赖来自 packages/qa。
// 引擎扩展：CWA_ENGINES="chromium,firefox,webkit"（默认 chromium，锁定
// Playwright 引擎；显式 CWA_CHROMIUM_CHANNEL 才使用系统浏览器）。
// F06 加固：
// - 启动前检测端口占用（旧服务不能冒充本次构建）；
// - 以本次 dist 的 release.json 为期望值，断言 served 身份完全一致；
// - 向全部子脚本注入统一的 CWA_DOCS_URL/PORT/CWA_BASE；
// - 每次运行写入 reports/optimization/runs/latest/（run manifest + 证据拷贝），
//   CI 失败也只携带本次产物，不会混入 checkout 中的历史 passed 报告。
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qaRequire = createRequire(path.join(root, "packages/qa/package.json"));
void qaRequire; // 显式表明 QA 依赖解析自 packages/qa（锁定的 Playwright/axe）。
const env = {
  ...process.env,
  CWA_BASE: process.env.CWA_BASE ?? "/cwa-design/",
  CWA_ENGINES: process.env.CWA_ENGINES ?? "chromium",
  PORT: process.env.PORT ?? "4173",
  NODE_ENV: process.env.NODE_ENV ?? "production",
};
const base = `http://127.0.0.1:${env.PORT}${env.CWA_BASE}`;

console.log("=== build docs (CWA_BASE=/cwa-design/) ===");
execFileSync("corepack", ["pnpm", "--filter", "@cwa-design/docs", "run", "build"], {
  cwd: root,
  env: { ...process.env, CWA_BASE: env.CWA_BASE, NVMD_NODE_VERSION: "24.21.0" },
  stdio: "inherit",
});
// 部署工作流同款静态检查（每页单 h1、深链接等），提前在门禁里拦截同类回归。
console.log("=== static site checks ===");
execFileSync("python3", ["scripts/verify-static-site.py"], {
  cwd: root,
  stdio: "inherit",
});

// F06：端口占用预检——旧服务不能冒充本次构建。
const net = await import("node:net");
const portBusy = await new Promise((resolve) => {
  const probe = net.createConnection({ host: "127.0.0.1", port: Number(env.PORT) }, () => {
    probe.destroy();
    resolve(true);
  });
  probe.on("error", () => resolve(false));
});
if (portBusy)
  throw new Error(
    `port ${env.PORT} already in use — a stale server would fake this run's build identity; free it or set PORT`,
  );

// F06：本次 dist 的期望身份（版本/commit/dirty/digest）。
const expectedRelease = JSON.parse(
  readFileSync(path.join(root, "apps/docs/dist/release.json"), "utf8"),
);
const expectedFingerprint = `sha256:${createHash("sha256")
  .update(readFileSync(path.join(root, "apps/docs/dist/index.html")))
  .digest("hex")}`;
console.log(
  `expected build identity: ${expectedRelease.version} @ ${expectedRelease.commit.slice(0, 7)} (dirty=${expectedRelease.dirty}) digest=${expectedRelease.registryDigest?.slice(0, 19)}`,
);

const runDir = path.join(root, "reports/optimization/runs/latest");
rmSync(runDir, { recursive: true, force: true });
mkdirSync(runDir, { recursive: true });
const runManifest = {
  startedAt: new Date().toISOString(),
  headSha: null,
  commit: expectedRelease.commit,
  version: expectedRelease.version,
  registryDigest: expectedRelease.registryDigest,
  homepageFingerprint: expectedFingerprint,
  base,
  port: Number(env.PORT),
  engines: env.CWA_ENGINES,
  stages: [],
};

const server = spawn("node", [path.join(root, "apps/docs/scripts/serve.mjs")], {
  cwd: path.join(root, "apps/docs"),
  env,
  stdio: "inherit",
});
let serverExited = false;
server.on("exit", () => {
  serverExited = true;
});

const writeManifest = () =>
  writeFileSync(
    path.join(runDir, "run-manifest.json"),
    `${JSON.stringify(runManifest, null, 2)}\n`,
  );

async function waitUntilReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (serverExited) throw new Error("docs server exited during startup");
    try {
      const release = await fetch(new URL("release.json", base)).then((r) => r.json());
      // F06：served 身份必须与本次 dist 完全一致，否则失败（旧服务冒充路径）。
      assert.deepStrictEqual(
        release,
        expectedRelease,
        "served release.json differs from this dist",
      );
      const servedFingerprint = `sha256:${createHash("sha256")
        .update(await fetch(base).then((r) => r.text()))
        .digest("hex")}`;
      if (servedFingerprint !== expectedFingerprint)
        throw new Error("served index.html fingerprint differs from this dist");
      console.log(
        `server ready and identity verified: ${release.version} @ ${release.commit.slice(0, 7)} (dirty=${release.dirty})`,
      );
      return release;
    } catch (error) {
      if (error instanceof Error && /differs|fingerprint/.test(error.message)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`docs server not ready at ${base}`);
}

import assert from "node:assert/strict";

try {
  const release = await waitUntilReady();
  runManifest.headSha = expectedRelease.commit;
  const stages = [
    {
      name: "docs harness",
      args: ["scripts/verify-docs-browser.mjs"],
      extraEnv: { CWA_DOCS_ENGINES: env.CWA_ENGINES },
    },
    { name: "contrast matrix", args: ["scripts/verify-composite-contrast.mjs"], extraEnv: {} },
    { name: "responsive geometry", args: ["scripts/verify-responsive-browser.mjs"], extraEnv: {} },
    { name: "tarball consumer", args: ["scripts/verify-tarball-consumer.mjs"], extraEnv: {} },
  ];
  let allPassed = true;
  for (const stage of stages) {
    console.log(`\n=== ${stage.name} ===`);
    const startedAt = new Date().toISOString();
    let status = "passed";
    try {
      execFileSync("node", stage.args, {
        cwd: root,
        env: {
          ...env,
          // F06：统一注入 URL/端口/base，子脚本不再各自默认。
          CWA_DOCS_URL: base,
          ...stage.extraEnv,
        },
        stdio: "inherit",
      });
    } catch {
      status = "failed";
      allPassed = false;
    }
    runManifest.stages.push({
      name: stage.name,
      status,
      startedAt,
      endedAt: new Date().toISOString(),
    });
    writeManifest();
  }
  // 证据拷贝：仅本次运行的报告（失败也携带已产出的部分）。
  for (const file of [
    "docs-browser-results.json",
    "composite-contrast-results.json",
    "responsive-browser-results.json",
    "tarball-results.json",
  ]) {
    const source = path.join(root, "reports/optimization", file);
    if (existsSync(source)) cpSync(source, path.join(runDir, file));
  }
  if (!allPassed) throw new Error("one or more browser gates failed (see stage statuses)");
  console.log(
    `\nAll browser gates passed against ${release.commit.slice(0, 7)}; evidence in reports/optimization/runs/latest.`,
  );
} finally {
  writeManifest();
  server.kill();
}
