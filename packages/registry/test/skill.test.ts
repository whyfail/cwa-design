// T28 校验：Skill 可移植（无个人路径）、references 与 manifest 同源一致。
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillDir = path.join(repoRoot, "skills", "cwa-design");
const manifestPath = path.join(
  repoRoot,
  "packages",
  "registry",
  "dist",
  "manifest",
  "react",
  "0.1.0-alpha.0",
  "manifest.json",
);

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

describe("CWA Design Skill（T28）", () => {
  it("SKILL.md 存在且无个人路径/敏感信息", () => {
    const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    expect(skill).toContain("name: cwa-design");
    expect(skill).not.toMatch(/\/Users\//);
    expect(skill).not.toMatch(/api[_-]?key/i);
    expect(skill).not.toMatch(/glm-[0-9a-f]{8}/i);
  });

  it("references 由 manifest 生成：契约数量与 id 与 manifest 完全一致", () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      components: Array<{ id: string }>;
      registryDigest: string;
    };
    const contractDir = path.join(skillDir, "references", "contracts");
    const contractFiles = readdirSync(contractDir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    expect(contractFiles).toEqual(manifest.components.map((c) => `${c.id}.json`).sort());

    const overview = readFileSync(path.join(skillDir, "references", "overview.md"), "utf8");
    expect(overview).toContain(manifest.registryDigest);
    expect(overview).toContain(`components: ${manifest.components.length}`);
  });

  it("每个契约 JSON 可解析且 id 匹配文件名", () => {
    const contractDir = path.join(skillDir, "references", "contracts");
    for (const file of readdirSync(contractDir)) {
      const record = JSON.parse(readFileSync(path.join(contractDir, file), "utf8")) as {
        id: string;
      };
      expect(record.id, file).toBe(file.replace(".json", ""));
    }
  });

  it("生成器幂等：重跑后字节不变", () => {
    const before = [...walk(skillDir)].map((f) => [f, readFileSync(f).toString("base64")] as const);
    execFileSync(
      process.execPath,
      [path.join(pkgRoot, "dist-scripts", "registry", "scripts", "generate-skill-references.js")],
      { cwd: repoRoot },
    );
    const after = [...walk(skillDir)].map((f) => [f, readFileSync(f).toString("base64")] as const);
    expect(after).toEqual(before);
  });

  it("无 MCP 降级路径：SKILL.md 不要求 MCP 存在", () => {
    const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    expect(skill).toContain("无 MCP 时");
    expect(existsSync(path.join(skillDir, "references", "components.md"))).toBe(true);
  });
});
