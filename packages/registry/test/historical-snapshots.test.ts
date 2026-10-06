// N05/N06 回归：历史版本快照必须能从源码目录冷构建恢复，digest 与示例数
// 不得随当前版本演进漂移（曾经发生过 alpha.1 归档被当前 Token 改写）。
// 当前可编辑版本不允许进入历史快照目录。
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { currentLibraryVersion, readArtifact, readSnapshot } from "../src/snapshot.js";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotsSource = path.join(pkgRoot, "snapshots", "react");
const builder = (await import(
  pathToFileURL(path.join(pkgRoot, "dist-scripts", "registry", "scripts", "build-manifest.js")).href
)) as { restoreHistoricalSnapshots: (destination?: string, source?: string) => void };

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

/** 已发布的不可变历史版本；digest 由原始发布产物固化，不得改动。 */
const EXPECTED_HISTORICAL: Array<{ version: string; digest: string; examples: number }> = [
  {
    version: "0.1.0-alpha.0",
    digest: "sha256:095bda6190018ed0ee6882a7e74c7130692f227e0b4e5b108a950585e6a157ec",
    examples: 3,
  },
  {
    version: "0.1.0-alpha.1",
    digest: "sha256:26fc17e480ae582f1defb1ec332034ee9e15e5e9a58f273468ea93ba1f678a48",
    examples: 31,
  },
  {
    // 79168ce 部署版（V07 冻结）：alpha.3 候选改动前从 dist 完整固化。
    version: "0.1.0-alpha.2",
    digest: "sha256:e65a3d1ea71ca13254a3b6986446c1510b173d71284ae2efaec7a63f5a3392ed",
    examples: 32,
  },
];

describe("历史 Registry 快照（按版本使用可信）", () => {
  it("源码快照目录包含全部已发布历史版本，且不含当前可编辑版本", () => {
    const versions = readdirSync(snapshotsSource).sort();
    const current = currentLibraryVersion(pkgRoot);
    expect(versions).toEqual(EXPECTED_HISTORICAL.map((entry) => entry.version));
    expect(versions).not.toContain(current);
  });

  for (const expected of EXPECTED_HISTORICAL) {
    it(`${expected.version}：manifest digest 与 artifacts 逐文件校验通过`, () => {
      const directory = path.join(snapshotsSource, expected.version);
      const snapshot = readSnapshot(directory);
      expect(snapshot.manifest.registryDigest).toBe(expected.digest);
      expect(snapshot.manifest.libraryVersion).toBe(expected.version);
      expect(snapshot.manifest.examples).toHaveLength(expected.examples);
      for (const artifact of snapshot.manifest.artifacts ?? []) {
        const { record, content } = readArtifact(snapshot, artifact.path);
        expect(record.contentDigest).toBe(artifact.contentDigest);
        expect(content.length).toBeGreaterThan(0);
      }
    });
  }

  it("冷构建恢复到空目录后与源快照逐字节一致", () => {
    const destination = path.join(
      mkdtempSync(path.join(tmpdir(), "cwa-restore-")),
      "manifest",
      "react",
    );
    fixtures.push(destination);
    builder.restoreHistoricalSnapshots(destination, snapshotsSource);
    for (const expected of EXPECTED_HISTORICAL) {
      const source = readSnapshot(path.join(snapshotsSource, expected.version));
      const restored = readSnapshot(path.join(destination, expected.version));
      expect(restored.manifest.registryDigest).toBe(source.manifest.registryDigest);
      const walk = (directory: string, prefix = ""): string[] =>
        readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
          const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
          return entry.isDirectory()
            ? walk(path.join(directory, entry.name), relative)
            : [relative];
        });
      const files = walk(path.join(destination, expected.version)).sort();
      const expectedFiles = [
        "manifest.json",
        ...(source.manifest.artifacts ?? []).map((artifact) => artifact.path),
      ].sort();
      expect(files).toEqual(expectedFiles);
    }
  });

  it("恢复目标与源不一致时拒绝覆盖（防漂移守卫生效）", () => {
    const destination = mkdtempSync(path.join(tmpdir(), "cwa-restore-guard-"));
    fixtures.push(destination);
    const versionDir = path.join(destination, EXPECTED_HISTORICAL[1]!.version);
    cpSync(path.join(snapshotsSource, EXPECTED_HISTORICAL[1]!.version), versionDir, {
      recursive: true,
    });
    // 写入一个不属于 manifest.artifacts 的文件，模拟生成物漂移。
    writeFileSync(path.join(versionDir, "drift.json"), "{}\n");
    expect(() => builder.restoreHistoricalSnapshots(destination, snapshotsSource)).toThrow(
      /Historical Registry source contains unlisted files|Historical Registry output differs/,
    );
  });
});
