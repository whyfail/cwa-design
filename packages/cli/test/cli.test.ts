import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { currentLibraryVersion } from "@cwa-design/registry/snapshot";
import { describe, expect, it } from "vitest";

const cli = new URL("../dist/index.js", import.meta.url).pathname;
const VERSION = currentLibraryVersion();

function run(args: string[], cwd?: string): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(process.execPath, [cli, ...args], {
      cwd: cwd ?? process.cwd(),
      encoding: "utf8",
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const err = error as { status: number; stdout: string; stderr: string };
    return { status: err.status ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

describe("cwa-design CLI（T26）", () => {
  it("doctor 输出诊断且 --json 可解析", () => {
    const human = run(["doctor"]);
    expect(human.status).toBe(0);
    expect(human.stdout).toContain("CWA Design doctor");
    const json = run(["doctor", "--json"]);
    const parsed = JSON.parse(json.stdout) as {
      ok: boolean;
      registryVersions: string[];
      checks: Array<{ pass: boolean }>;
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.registryVersions).toContain(`react@${VERSION}`);
    expect((parsed as { selectedVersion?: string }).selectedVersion).toBe(VERSION);
  });

  it("search 命中 button；--json 结构完整", () => {
    const json = JSON.parse(run(["search", "button", "--json"]).stdout) as {
      results: Array<{ id: string }>;
      total: number;
    };
    expect(json.total).toBeGreaterThanOrEqual(1);
    expect(json.results.map((r) => r.id)).toContain("button");
  });

  it("inspect 返回 button 契约；未知组件 exit 非 0 且 code 正确", () => {
    const json = JSON.parse(run(["inspect", "button", "--json"]).stdout) as {
      data: { name: string; materialPolicy: string };
    };
    expect(json.data.name).toBe("Button");
    const bad = run(["inspect", "not-exist", "--json"]);
    expect(bad.status).not.toBe(0);
    const err = JSON.parse(bad.stdout) as { error: { code: string } };
    expect(err.error.code).toBe("COMPONENT_NOT_FOUND");
  });

  it("未知版本报 VERSION_NOT_FOUND 不静默降级", () => {
    const bad = run(["inspect", "button", "--version=9.9.9", "--json"]);
    expect(bad.status).not.toBe(0);
    const err = JSON.parse(bad.stdout) as { error: { code: string } };
    expect(err.error.code).toBe("VERSION_NOT_FOUND");
  });

  it("plan 输出安装计划且不写文件（dry-run 语义）", () => {
    const json = JSON.parse(run(["plan", "button", "input", "--json"]).stdout) as {
      install: { packages: string[] };
      components: Array<{ id: string }>;
      warnings: string[];
    };
    expect(json.install.packages).toEqual([`@cwa-design/react@${VERSION}`]);
    expect(json.components.map((c) => c.id)).toEqual(["button", "input"]);
    expect(json.warnings.some((w) => w.includes("不写入"))).toBe(true);
  });

  it("未知命令报 INVALID_INPUT", () => {
    const bad = run(["frobnicate", "--json"]);
    expect(bad.status).not.toBe(0);
    const err = JSON.parse(bad.stdout) as { error: { code: string } };
    expect(err.error.code).toBe("INVALID_INPUT");
  });

  it("search/plan 均尊重确切旧版，不把范围当作版本", () => {
    const search = JSON.parse(
      run(["search", "button", "--version=0.1.0-alpha.0", "--json"]).stdout,
    ) as { libraryVersion: string };
    expect(search.libraryVersion).toBe("0.1.0-alpha.0");
    const plan = JSON.parse(
      run(["plan", "button", "--version=0.1.0-alpha.0", "--json"]).stdout,
    ) as { install: { packages: string[]; publicationStatus: string } };
    expect(plan.install.packages).toEqual(["@cwa-design/react@0.1.0-alpha.0"]);
    expect(plan.install.publicationStatus).toBe("not-verified");
    for (const command of ["search", "plan", "init", "tokens"]) {
      const bad = run([command, "button", "--version=^0.1.0", "--json"]);
      expect(bad.status).not.toBe(0);
      expect((JSON.parse(bad.stdout) as { error: { code: string } }).error.code).toBe(
        "INVALID_INPUT",
      );
    }
    expect(run(["search", "--limit=NaN", "--json"]).status).not.toBe(0);
  });

  it("example 返回真实 TSX，digest 与源匹配；旧版不借新源码", () => {
    const example = JSON.parse(run(["example", "button-basic", "--json"]).stdout) as {
      libraryVersion: string;
      data: { source: string; contentDigest: string; artifact: { contentDigest: string } };
    };
    expect(example.libraryVersion).toBe(VERSION);
    expect(example.data.source).toContain("@cwa-design/react");
    expect(`sha256:${createHash("sha256").update(example.data.source).digest("hex")}`).toBe(
      example.data.contentDigest,
    );
    expect(example.data.artifact.contentDigest).toBe(example.data.contentDigest);
    const old = run(["example", "button-basic", "--version=0.1.0-alpha.0", "--json"]);
    expect(old.status).not.toBe(0);
    expect((JSON.parse(old.stdout) as { error: { code: string } }).error.code).toBe(
      "REGISTRY_UNAVAILABLE",
    );
  });

  it("tokens 与 recipe 读取版本快照，返回真实限制", () => {
    const tokens = JSON.parse(run(["tokens", "--json"]).stdout) as {
      libraryVersion: string;
      data: { libraryVersion: string };
    };
    expect(tokens.libraryVersion).toBe(VERSION);
    expect(tokens.data.libraryVersion).toBe(VERSION);
    const recipe = JSON.parse(run(["recipe", "ai-workspace", "--json"]).stdout) as {
      data: { sources: Array<{ source: string }>; limitations: string[] };
    };
    expect(recipe.data.sources[0]!.source).toContain("AiWorkspaceRecipe");
    expect(recipe.data.limitations.some((item) => item.includes("模型"))).toBe(true);
    const old = run(["tokens", "--version=0.1.0-alpha.0", "--json"]);
    expect((JSON.parse(old.stdout) as { error: { code: string } }).error.code).toBe(
      "REGISTRY_UNAVAILABLE",
    );
  });
});
