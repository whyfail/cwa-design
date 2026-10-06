// V07：浏览器门禁统一入口——构建官网（部署同款 base）、启动静态服务、
// 依次运行 Chromium 核心门禁，失败即非零退出。QA 依赖来自 packages/qa。
// 引擎扩展：CWA_ENGINES="chromium,firefox,webkit"（默认 chromium）。
import { execFileSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = {
  ...process.env,
  CWA_BASE: process.env.CWA_BASE ?? "/cwa-design/",
  CWA_ENGINES: process.env.CWA_ENGINES ?? "chromium",
  NODE_ENV: process.env.NODE_ENV ?? "production",
};
const docsDist = path.join(root, "apps/docs/dist");
rmSync(path.join(docsDist, ".verify-server.pid"), { force: true });

const run = (name, command, args, extraEnv = {}) => {
  console.log(`\n=== ${name} ===`);
  execFileSync(command, args, {
    cwd: root,
    env: { ...env, ...extraEnv },
    stdio: "inherit",
  });
};

console.log("=== build docs (CWA_BASE=/cwa-design/) ===");
execFileSync("corepack", ["pnpm", "--filter", "@cwa-design/docs", "run", "build"], {
  cwd: root,
  env: { ...process.env, CWA_BASE: env.CWA_BASE, NVMD_NODE_VERSION: "24.21.0" },
  stdio: "inherit",
});
// 部署工作流同款静态检查（每页单 h1、深链接等），提前在门禁里拦截同类回归。
run("static site checks", "python3", ["scripts/verify-static-site.py"]);

const server = spawn("node", [path.join(root, "apps/docs/scripts/serve.mjs")], {
  cwd: path.join(root, "apps/docs"),
  env: { ...env, PORT: process.env.PORT ?? "4173" },
  stdio: "inherit",
});
let serverExited = false;
server.on("exit", () => {
  serverExited = true;
});

const base = `http://127.0.0.1:${process.env.PORT ?? "4173"}${env.CWA_BASE}`;
async function waitUntilReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (serverExited) throw new Error("docs server exited during startup");
    try {
      const release = await fetch(new URL("release.json", base)).then((r) => r.json());
      console.log(
        `server ready: ${release.version} @ ${release.commit.slice(0, 7)} (dirty=${release.dirty})`,
      );
      if (release.dirty === true)
        console.warn("WARNING: build identity is dirty — results may not match a clean tree");
      return release;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`docs server not ready at ${base}`);
}

try {
  const release = await waitUntilReady();
  run("docs harness", "node", ["scripts/verify-docs-browser.mjs"], {
    CWA_DOCS_ENGINES: env.CWA_ENGINES,
  });
  run("contrast matrix", "node", ["scripts/verify-composite-contrast.mjs"]);
  run("responsive geometry", "node", ["scripts/verify-responsive-browser.mjs"]);
  run("tarball consumer", "node", ["scripts/verify-tarball-consumer.mjs"]);
  console.log(`\nAll browser gates passed against ${release.commit.slice(0, 7)}.`);
} finally {
  server.kill();
}
