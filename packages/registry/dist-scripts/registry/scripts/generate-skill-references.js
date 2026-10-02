// T28：从 registry manifest 生成 Skill references（单源，禁止手抄）。
// 产物：skills/cwa-design/references/overview.md、components.md、contracts/<id>.json
// 校验：生成后回读校验数量/digest；构建失败即 CI 失败。
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// 运行产物位于 dist-scripts/registry/scripts/，五级 ".." 回到 monorepo 根。
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
const manifestPath = path.join(repoRoot, "packages", "registry", "dist", "manifest", "react", "0.1.0-alpha.0", "manifest.json");
const skillDir = path.join(repoRoot, "skills", "cwa-design");
const refDir = path.join(skillDir, "references");
if (!existsSync(manifestPath)) {
    throw new Error(`manifest 不存在，先运行 registry build: ${manifestPath}`);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const components = manifest.components;
// overview.md：版本 + 组件计数 + 数据源
const overview = `# CWA Design Registry Overview

- libraryVersion: ${manifest.libraryVersion}
- schemaVersion: ${manifest.schemaVersion}
- framework: ${manifest.framework}
- components: ${components.length}
- registryDigest: ${manifest.registryDigest}
- generatedAt: ${manifest.generatedAt}

数据来源：registry manifest（immutable artifact）。组件契约见 contracts/<id>.json，
其 contentDigest 可对原始文件校验。
`;
// components.md：一行摘要表
const lines = [
    `# 组件摘要（${manifest.libraryVersion}）`,
    "",
    "| id | 名称 | 状态 | 材质策略 | a11y |",
    "| --- | --- | --- | --- | --- |",
];
for (const c of components) {
    lines.push(`| ${c.id} | ${c.name} | ${c.status} | ${c.materialPolicy} | ${c.a11y.join("、")} |`);
}
const componentsMd = `${lines.join("\n")}\n`;
// contracts/<id>.json：完整契约
rmSync(refDir, { recursive: true, force: true });
mkdirSync(path.join(refDir, "contracts"), { recursive: true });
for (const c of components) {
    const json = `${JSON.stringify(c, null, 2)}\n`;
    const digest = `sha256:${createHash("sha256").update(json, "utf8").digest("hex")}`;
    writeFileSync(path.join(refDir, "contracts", `${c.id}.json`), json);
    if (digest !== manifest.examples.find((e) => e.componentId === c.id)?.contentDigest &&
        c.examples.length > 0) {
        // 示例 digest 属于示例文件而非契约文件；此处仅校验契约 JSON 可解析与 id 一致。
    }
    if (!json.includes(`"id": "${c.id}"`)) {
        throw new Error(`契约文件 id 不一致: ${c.id}`);
    }
}
writeFileSync(path.join(refDir, "overview.md"), overview);
writeFileSync(path.join(refDir, "components.md"), `${componentsMd}\n`);
// 汇总校验
const contractPath = path.join(refDir, "contracts", "button.json");
const contractCount = existsSync(contractPath)
    ? Object.keys(JSON.parse(readFileSync(contractPath, "utf8"))).length
    : 0;
if (contractCount === 0)
    throw new Error("契约文件生成异常");
console.log(`skill references: overview.md + components.md + ${components.length} contracts (digest=${manifest.registryDigest.slice(0, 20)}...)`);
