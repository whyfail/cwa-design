// T28 校验：Skill 可移植（无个人路径）、references 与 manifest 同源一致。
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import {
  contentDigest,
  currentLibraryVersion,
  loadSnapshots,
  readArtifact,
  readSnapshot,
} from "../src/snapshot.js";

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
  currentLibraryVersion(pkgRoot),
  "manifest.json",
);
const snapshot = readSnapshot(path.dirname(manifestPath));
const builder = (await import(
  pathToFileURL(path.join(pkgRoot, "dist-scripts", "registry", "scripts", "build-manifest.js")).href
)) as { compileSources: (files: string[]) => void };
const temporaryDirectories: string[] = [];
afterAll(() => {
  for (const directory of temporaryDirectories) rmSync(directory, { recursive: true, force: true });
});

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

  it("hash index 校验实际原始字节，产物与当前快照完全一致", () => {
    const directory = path.join(skillDir, "references");
    const index = JSON.parse(readFileSync(path.join(directory, "index.json"), "utf8")) as {
      libraryVersion: string;
      registryDigest: string;
      digestMethod: string;
      files: Array<{ path: string; contentDigest: string; byteSize: number }>;
    };
    expect(index.libraryVersion).toBe(snapshot.manifest.libraryVersion);
    expect(index.registryDigest).toBe(snapshot.manifest.registryDigest);
    expect(index.digestMethod).toBe("sha256-raw-file-bytes");
    for (const entry of index.files) {
      const bytes = readFileSync(path.join(directory, entry.path));
      expect(bytes.byteLength, entry.path).toBe(entry.byteSize);
      expect(contentDigest(bytes), entry.path).toBe(entry.contentDigest);
    }
    for (const artifact of snapshot.manifest.artifacts ?? []) {
      const copied = readFileSync(path.join(directory, artifact.path), "utf8");
      expect(copied, artifact.path).toBe(readArtifact(snapshot, artifact.path).content);
      expect(contentDigest(copied), artifact.path).toBe(artifact.contentDigest);
      if (artifact.sourcePath && artifact.sourceDigest)
        expect(
          contentDigest(readFileSync(path.join(repoRoot, artifact.sourcePath))),
          artifact.sourcePath,
        ).toBe(artifact.sourceDigest);
    }
  });

  it("各版本 Skill 使用自己的 manifest/hash 与产物能力", () => {
    for (const versionSnapshot of loadSnapshots(path.join(pkgRoot, "dist", "manifest", "react"))) {
      const version = versionSnapshot.manifest.libraryVersion;
      for (const directory of [
        path.join(skillDir, "references", "versions", "react", version),
        path.join(pkgRoot, "dist", "skills", "react", version),
      ]) {
        const references = path.join(directory, "references");
        expect(readFileSync(path.join(directory, "SKILL.md"), "utf8")).toContain(
          "name: cwa-design",
        );
        const index = JSON.parse(readFileSync(path.join(references, "index.json"), "utf8")) as {
          libraryVersion: string;
          registryDigest: string;
          files: Array<{ path: string; contentDigest: string; byteSize: number }>;
        };
        expect(index.libraryVersion).toBe(version);
        expect(index.registryDigest).toBe(versionSnapshot.manifest.registryDigest);
        for (const entry of index.files) {
          const bytes = readFileSync(path.join(references, entry.path));
          expect(contentDigest(bytes), `${version}/${entry.path}`).toBe(entry.contentDigest);
          expect(bytes.byteLength).toBe(entry.byteSize);
        }
        if (!versionSnapshot.manifest.artifacts) {
          expect(existsSync(path.join(references, "tokens.json"))).toBe(false);
          expect(existsSync(path.join(references, "examples", "button-basic.tsx"))).toBe(false);
        }
      }
    }
  });

  it("可下载 recipe 与 helper 在自有临时目录组合编译", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "cwa-skill-recipes-"));
    temporaryDirectories.push(directory);
    cpSync(path.join(skillDir, "references", "recipes"), path.join(directory, "recipes"), {
      recursive: true,
    });
    const files = [...new Set(snapshot.manifest.recipes.flatMap((recipe) => recipe.files))];
    expect(files).toContain("recipes/recipe-scope.tsx");
    for (const recipe of snapshot.manifest.recipes)
      expect(recipe.files).toContain("recipes/recipe-scope.tsx");
    expect(() =>
      builder.compileSources(files.map((file) => path.join(directory, file))),
    ).not.toThrow();
  }, 15000);

  it("Skill 准确描述 MCP cursor，而不宣称不存在的 resources/read", () => {
    const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    expect(skill).toContain("sourcePage.offset");
    expect(skill).toContain("nextCursor");
    expect(skill).toContain('part: "root"');
    expect(skill).not.toContain("按资源 URI");
  });
});
