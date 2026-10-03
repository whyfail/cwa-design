import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { currentLibraryVersion, contentDigest, loadSnapshots, readArtifact } from "../src/snapshot.js";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
const registryRoot = path.join(repoRoot, "packages/registry");
const skillDir = path.join(repoRoot, "skills/cwa-design");
const refDir = path.join(skillDir, "references");
const snapshots = loadSnapshots(path.join(registryRoot, "dist/manifest/react"));
const currentVersion = currentLibraryVersion(registryRoot);
const current = snapshots.find((snapshot) => snapshot.manifest.libraryVersion === currentVersion);
if (!current)
    throw new Error(`Current registry snapshot is missing: ${currentVersion}`);
const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
function generateReferences(snapshot, directory) {
    const manifest = snapshot.manifest;
    const index = [];
    const put = (file, content) => {
        mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
        writeFileSync(path.join(directory, file), content);
        index.push({ path: file, contentDigest: contentDigest(content), byteSize: Buffer.byteLength(content) });
    };
    put("manifest.json", readFileSync(path.join(snapshot.directory, "manifest.json"), "utf8"));
    put("overview.md", `# CWA Design Registry Overview\n\n- libraryVersion: ${manifest.libraryVersion}\n- schemaVersion: ${manifest.schemaVersion}\n- framework: ${manifest.framework}\n- components: ${manifest.components.length}\n- examples: ${manifest.examples.length}\n- recipes: ${manifest.recipes.length}\n- registryDigest: ${manifest.registryDigest}\n- generatedAt: ${manifest.generatedAt}\n\n组件契约见 contracts/<id>.json。index.json 对每个参考文件记录原始字节 SHA-256（不包括 index 自身）。\nRegistry digest 的算法是 JSON 两空格缩进、registryDigest 置空、不含最终换行。\n${manifest.artifacts ? "已编译 TSX、配方与同版本 Tokens 快照随参考文件分发。" : "旧版本仅含元数据；不包含完整源码或 Tokens，禁止借用其他版本冒充。"}\n`);
    const lines = [`# 组件摘要（${manifest.libraryVersion}）`, "", "| id | 名称 | 用途 | 材质策略 |", "| --- | --- | --- | --- |"];
    for (const component of manifest.components) {
        lines.push(`| ${component.id} | ${component.name} | ${(component.description ?? "见对应版本 TS 声明").replaceAll("|", "\\|")} | ${component.materialPolicy} |`);
        put(`contracts/${component.id}.json`, `${JSON.stringify(component, null, 2)}\n`);
    }
    put("components.md", `${lines.join("\n")}\n`);
    for (const artifact of manifest.artifacts ?? []) {
        if (artifact.path.startsWith("contracts/"))
            continue;
        put(artifact.path, readArtifact(snapshot, artifact.path).content);
    }
    put("recipes.json", `${JSON.stringify(manifest.recipes, null, 2)}\n`);
    put("examples.json", `${JSON.stringify(manifest.examples, null, 2)}\n`);
    writeFileSync(path.join(directory, "index.json"), `${JSON.stringify({ schemaVersion: manifest.schemaVersion, libraryVersion: manifest.libraryVersion, registryDigest: manifest.registryDigest, digestMethod: "sha256-raw-file-bytes", files: index.sort((a, b) => a.path.localeCompare(b.path)) }, null, 2)}\n`);
}
rmSync(refDir, { recursive: true, force: true });
mkdirSync(refDir, { recursive: true });
generateReferences(current, refDir);
for (const snapshot of snapshots) {
    const versionDir = path.join(refDir, "versions/react", snapshot.manifest.libraryVersion);
    mkdirSync(versionDir, { recursive: true });
    writeFileSync(path.join(versionDir, "SKILL.md"), skill);
    generateReferences(snapshot, path.join(versionDir, "references"));
    const packaged = path.join(registryRoot, "dist/skills/react", snapshot.manifest.libraryVersion);
    rmSync(packaged, { recursive: true, force: true });
    mkdirSync(path.dirname(packaged), { recursive: true });
    cpSync(versionDir, packaged, { recursive: true });
}
if (!existsSync(path.join(refDir, "contracts/button.json")))
    throw new Error("Skill contract generation failed");
console.log(`skill references: ${snapshots.length} version bundles; current ${currentVersion}, ${current.manifest.components.length} contracts, verified source/Token hashes`);
