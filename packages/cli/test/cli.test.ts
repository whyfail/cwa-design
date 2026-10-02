import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const cli = new URL("../dist/index.js", import.meta.url).pathname;

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
    expect(parsed.registryVersions[0]).toContain("0.1.0-alpha.0");
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
    expect(json.install.packages).toEqual(["@cwa-design/react"]);
    expect(json.components.map((c) => c.id)).toEqual(["button", "input"]);
    expect(json.warnings.some((w) => w.includes("不写入"))).toBe(true);
  });

  it("未知命令报 INVALID_INPUT", () => {
    const bad = run(["frobnicate", "--json"]);
    expect(bad.status).not.toBe(0);
    const err = JSON.parse(bad.stdout) as { error: { code: string } };
    expect(err.error.code).toBe("INVALID_INPUT");
  });
});
