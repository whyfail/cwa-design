// F06 配置校验（纯 Node，非浏览器）：发布链必须满足
// 1) deploy-pages 的 deploy 依赖同工作流 gate + build；
// 2) gate 执行完整 pnpm verify；
// 3) ci.yml 不再在 push main 触发（无双轨 CI 失败仍部署的路径）。
// 失败夹具：注释掉 needs 或恢复 push 触发都会被此处拒绝。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const deployYaml = readFileSync(path.join(root, ".github/workflows/deploy-pages.yml"), "utf8");
const ciYaml = readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");

assert.match(
  deployYaml,
  /deploy:\s*[\s\S]*?needs:\s*\[gate, build\]/,
  "deploy job must depend on [gate, build] in the same workflow",
);
assert.match(deployYaml, /corepack pnpm verify/, "gate job must run the full pnpm verify");
assert.match(deployYaml, /needs:\s*\[gate\]/, "build job must depend on gate");
assert.doesNotMatch(
  ciYaml,
  /\n\s*push:\s*[\s\S]*?branches:\s*\n?\s*- main/,
  "ci.yml must not trigger on push to main (release chain owns it)",
);
assert.match(ciYaml, /pull_request:/, "ci.yml keeps PR verification");

// 交付报告推导数据（F06）：从真实 manifest 读取组件/示例/配方数。
const manifest = JSON.parse(
  readFileSync(
    path.join(root, "packages/registry/dist/manifest/react/0.1.0-alpha.4/manifest.json"),
    "utf8",
  ),
);
console.log(
  `manifest: ${manifest.components.length} components, ${manifest.examples.length} examples, ${manifest.recipes.length} recipes; digest ${manifest.registryDigest.slice(0, 19)}`,
);
assert.equal(manifest.components.length, 30);
assert.equal(manifest.examples.length, 32);
console.log("release gate config: dependency chain verified");
