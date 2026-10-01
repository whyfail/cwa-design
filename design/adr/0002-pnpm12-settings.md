# ADR-0002：pnpm 12 配置迁移与 supply-chain 政策

状态：accepted（T02 实测） · 日期：2026-10-02

## 背景

主计划按 pnpm 12.8.1 核验，但 pnpm 12 相对主计划写作时的假设有两处行为变化，T02 安装阶段实测暴露。

## 决策

### 1. 构建脚本许可

- pnpm 12 不再读取 `package.json#pnpm.onlyBuiltDependencies`（实测警告 "The pnpm field in package.json is no longer read"）。
- 正确位置是 `pnpm-workspace.yaml` 的 **`allowBuilds`** 映射（`onlyBuiltDependencies` 列表形式在本版不生效）：

```yaml
allowBuilds:
  esbuild: true
  pnpm: true
```

当前仅放行 esbuild（vite/rolldown 二进制）与 pnpm 自身（devDep postinstall）。

### 2. minimumReleaseAge 供应链政策

- pnpm 12.8.1 默认启用 `minimumReleaseAge` 政策：发布时间过新的包在 lockfile 校验阶段**拒绝安装**（ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION）。
- 实测触发：`motion@13.5.0`（framer-motion/motion-dom/motion-utils）与 `vite@8.3.2` 均发布于 2026-10-01，落入默认窗口。
- 在 workspace 安装时 pnpm 自动将这 5 个包写入 `minimumReleaseAgeExclude`；pnpm-workspace.yaml 保留该列表（pin 到 exact 版本，仅覆盖本次核验通过的包，不放行未来的新版本）。

## 影响

- 干净消费者（无本仓配置）在依赖刚发布的窗口期会复现该错误：这是 pnpm 12 默认安全政策，不是本库缺陷；文档将说明消费者的处理方式（等待窗口过期或按 pnpm 文档显式 exclude）。
- 后续升级 motion/vite 时，若新版本仍在发布窗口内，需更新 `minimumReleaseAgeExclude` 的版本号。
