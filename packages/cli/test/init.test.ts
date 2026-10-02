// T27：init/apply 写入纪律测试（dry-run/幂等/合并/回滚/路径安全）。
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { applyInit, planInit } from "../src/init.js";

const cli = new URL("../dist/index.js", import.meta.url).pathname;
const VERSION = "0.1.0-alpha.0";

const tmpDirs: string[] = [];
function makeTmp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "cwa-init-"));
  tmpDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true });
});

describe("planInit/applyInit（库层）", () => {
  it("dry-run（planInit）不创建文件", () => {
    const dir = makeTmp();
    const plan = planInit(dir, VERSION);
    expect(plan.action).toBe("create");
    expect(existsSync(path.join(dir, "cwa-design.json"))).toBe(false);
  });

  it("apply 创建文件；二次 apply 幂等（内容不变）", () => {
    const dir = makeTmp();
    applyInit(dir, VERSION);
    const first = readFileSync(path.join(dir, "cwa-design.json"), "utf8");
    const plan2 = applyInit(dir, VERSION);
    expect(plan2.action).toBe("up-to-date");
    expect(readFileSync(path.join(dir, "cwa-design.json"), "utf8")).toBe(first);
  });

  it("已有配置 merge：用户键保留、缺失键补默认、hash 记录", () => {
    const dir = makeTmp();
    writeFileSync(
      path.join(dir, "cwa-design.json"),
      `${JSON.stringify({ provider: { theme: "dark", locale: "en-US" } }, null, 2)}\n`,
    );
    applyInit(dir, VERSION);
    const config = JSON.parse(readFileSync(path.join(dir, "cwa-design.json"), "utf8")) as {
      provider: Record<string, string>;
      previousHash?: string;
    };
    expect(config.provider.theme).toBe("dark"); // 用户值优先
    expect(config.provider.material).toBe("auto"); // 缺失键补默认
    expect(config.provider.locale).toBe("en-US");
    expect(config.previousHash).toBeTruthy();
  });

  it("cwd 内新建子目录合法（攻击面为符号链接，另测）", () => {
    const dir = makeTmp();
    applyInit(path.join(dir, "nested"), VERSION);
    expect(existsSync(path.join(dir, "nested", "cwa-design.json"))).toBe(true);
  });

  it("符号链接 cwd 拒绝", () => {
    const real = makeTmp();
    const holder = makeTmp();
    const linked = path.join(holder, "linked");
    symlinkSync(real, linked);
    expect(() => applyInit(linked, VERSION)).toThrow(/符号链接/);
  });
});

describe("cwa-design init（CLI 层）", () => {
  it("默认 dry-run 不写文件；--apply 写入；--json 可解析", () => {
    const dir = makeTmp();
    const dry = execFileSync(process.execPath, [cli, "init", "--json"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect((JSON.parse(dry) as { action: string }).action).toBe("create");
    expect(existsSync(path.join(dir, "cwa-design.json"))).toBe(false);

    execFileSync(process.execPath, [cli, "init", "--apply", "--json"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect(existsSync(path.join(dir, "cwa-design.json"))).toBe(true);

    const again = JSON.parse(
      execFileSync(process.execPath, [cli, "init", "--apply", "--json"], {
        cwd: dir,
        encoding: "utf8",
      }).toString(),
    ) as { action: string };
    expect(again.action).toBe("up-to-date");
  });
});
