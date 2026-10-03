# CWA Design CLI

候选源码构建后使用 `node packages/cli/dist/index.js <命令>`。所有读取来自本地 Registry 快照，并按 `--version=<确切 SemVer>` 查询；省略时使用 Registry 包自身版本。不存在或非法版本直接拒绝，禁止静默降级。

```sh
node packages/cli/dist/index.js doctor --json
node packages/cli/dist/index.js search button --version=0.1.0-alpha.2 --json
node packages/cli/dist/index.js inspect select --version=0.1.0-alpha.2 --json
node packages/cli/dist/index.js example button-basic --version=0.1.0-alpha.2 --json
node packages/cli/dist/index.js tokens --version=0.1.0-alpha.2 --json
node packages/cli/dist/index.js recipe settings --version=0.1.0-alpha.2 --json
node packages/cli/dist/index.js plan button input --version=0.1.0-alpha.2 --json
```

`example`、`tokens`、`recipe` 读取 hash 校验后的真实版本产物；旧版快照缺文件时返回 `REGISTRY_UNAVAILABLE`。安装计划固定版本并明确 npm 发布未核验，不证明该包已可安装。

`init` 默认 dry-run；只有 `init --apply` 写入当前工作区的 `cwa-design.json`。先校验版本，再原子写入；保留用户配置，版本变更进入 diff，拒绝符号链接，失败时回滚。默认配置用 `schemaVersion` 标注格式，不生成不存在的远程 schema 地址；已有用户 `$schema` 会保留。
