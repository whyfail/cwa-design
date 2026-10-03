// T27：init 配置写入。纪律：默认 dry-run（plan）；--apply 显式写入；
// 单文件（cwa-design.json）；路径逃逸/符号链接拒绝；幂等；失败回滚。

import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { RegistryError } from "@cwa-design/registry";

export const CONFIG_FILE = "cwa-design.json";

export interface InitPlan {
  action: "create" | "merge" | "up-to-date";
  file: string;
  diff: string[];
}

export interface CwaConfig {
  $schema?: string;
  schemaVersion?: string;
  provider: Record<string, string>;
  version: string;
  previousHash?: string;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function defaultProvider(): Record<string, string> {
  return { theme: "system", material: "auto", motion: "system", locale: "zh-CN" };
}

function defaultConfig(version: string): CwaConfig {
  return {
    schemaVersion: "1.0.0",
    provider: defaultProvider(),
    version,
  };
}

/** 路径安全：拒绝逃出目标目录与符号链接（含中间路径与目标本身）。 */
function assertSafeTarget(targetFile: string, cwd: string): void {
  const resolved = path.resolve(targetFile);
  const root = path.resolve(cwd);
  if (!resolved.startsWith(root + path.sep)) {
    throw new RegistryError("INVALID_INPUT", `写入目标逃出工作区: ${resolved}`);
  }
  let dir = path.dirname(resolved);
  while (dir.startsWith(root)) {
    if (existsSync(dir) && lstatSync(dir).isSymbolicLink()) {
      throw new RegistryError("INVALID_INPUT", `路径含符号链接，拒绝写入: ${dir}`);
    }
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  if (existsSync(resolved) && lstatSync(resolved).isSymbolicLink()) {
    throw new RegistryError("INVALID_INPUT", `目标为符号链接，拒绝写入: ${resolved}`);
  }
}

function readExisting(file: string): CwaConfig | null {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as CwaConfig;
  } catch {
    throw new RegistryError("INVALID_INPUT", `${CONFIG_FILE} 不是合法 JSON；请手工修复后重试`);
  }
}

/** 纯读取，不写。up-to-date 判定基于"本次命令会写出的完整内容"。 */
export function planInit(cwd: string, version: string): InitPlan {
  const file = path.join(cwd, CONFIG_FILE);
  const existing = readExisting(file);
  if (!existing) {
    return { action: "create", file, diff: [`+ ${CONFIG_FILE}（新文件，provider 默认值）`] };
  }
  const merged: CwaConfig = {
    ...defaultConfig(version),
    ...existing,
    version,
    provider: { ...defaultConfig(version).provider, ...existing.provider },
  };
  const nextRaw = `${JSON.stringify(merged, null, 2)}\n`;
  const currentRaw = readFileSync(file, "utf8");
  if (nextRaw === currentRaw) {
    return { action: "up-to-date", file, diff: [] };
  }
  const keys = new Set([
    ...Object.keys(defaultProvider()),
    ...Object.keys(existing.provider ?? {}),
  ]);
  const diff: string[] = [];
  if (existing.version !== version)
    diff.push(`~ version: ${existing.version ?? "未设置"} → ${version}`);
  if (existing.schemaVersion === undefined) diff.push('+ schemaVersion = "1.0.0"');
  for (const key of keys) {
    const before = existing.provider?.[key];
    const after = defaultProvider()[key];
    if (before === undefined) diff.push(`+ provider.${key} = ${JSON.stringify(after)}`);
  }
  return { action: "merge", file, diff };
}

/** 显式 apply：原子写（临时文件 + rename）；失败回滚备份。 */
export function applyInit(cwd: string, version: string): InitPlan {
  const plan = planInit(cwd, version);
  if (plan.action === "up-to-date") return plan;
  const file = plan.file;
  assertSafeTarget(file, cwd);

  const existingRaw = existsSync(file) ? readFileSync(file, "utf8") : null;
  let nextRaw: string;
  if (plan.action === "create") {
    nextRaw = `${JSON.stringify(defaultConfig(version), null, 2)}\n`;
  } else {
    const existing = readExisting(file)!;
    const merged: CwaConfig = {
      ...defaultConfig(version),
      ...existing,
      version,
      provider: { ...defaultProvider(), ...existing.provider },
      previousHash: sha256(existingRaw ?? ""),
    };
    nextRaw = `${JSON.stringify(merged, null, 2)}\n`;
  }

  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  const backupPath = `${file}.cwa-bak`;
  try {
    writeFileSync(tmp, nextRaw);
    if (existingRaw !== null) writeFileSync(backupPath, existingRaw);
    renameSync(tmp, file);
  } catch (error) {
    // 回滚：恢复备份（或移除半成品），尽力而为；主错误如实抛出
    try {
      if (existsSync(tmp)) rmSync(tmp, { force: true });
      if (existingRaw !== null) writeFileSync(file, existingRaw);
      else if (existsSync(file)) rmSync(file, { force: true });
    } catch {
      // ignore：主错误优先
    }
    throw new RegistryError(
      "REGISTRY_UNAVAILABLE",
      `init 写入失败已回滚: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return plan;
}
