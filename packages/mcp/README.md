# CWA Design MCP

本地 stdio 只读服务，消费 `@cwa-design/registry` 的确切版本快照。不会写工程、运行命令、联网或调用模型后端。

源码候选启动：先在仓库根目录执行 `pnpm run build` 与 `pnpm run registry:build`，再用 `node packages/mcp/dist/index.js`。本地快照不代表 npm 已发布；不要把候选版本的 npm 安装命令当成已验证的发布渠道。

先调用 `cwa_design_get_capabilities`，读取 `libraryVersion`、`registryVersions`、`registryDigest` 与产物能力。其余查询传入项目实际安装的 `version`，禁止范围版本。省略版本时使用本地 Registry 包的版本，不按目录排序猜测最新版本。

- `search_components`：按版本搜索，`nextCursor` 绑定版本与 query，不能换查询复用。
- `get_component`：读取真实 API/继承类型/复合部件。大型契约用 `sections: ["api"]`、`part: "root"`，再按 `availableParts` 查询，例如 `part: "SelectContent"`。其他 sections 为 `a11y`、`material`、`examples`。
- `get_example`：包含真实 TSX。读取 `source`，若存在 `nextCursor`，继续传入同一 `exampleId`、版本与 cursor。按 `sourcePage.offset` 拼接，offset 单位为 Unicode 字符。`sourcePage.chunkDigest` 验证当前片段，`artifact.contentDigest` 验证拼接后的完整文件。`compiled` 只描述该快照的编译结果。
- `get_tokens`：`theme: "all"` 包含浅色和深色；`groups` 可显式限定。按 `nextCursor` 继续，将 `primitive`、`semantic-light`、`semantic-dark`、`motion` 各页按 group/key 合并。
- `get_recipe`：包含真实配方的组合、源码和业务限制。按 cursor 继续，按 `sources[].file` 与 `sourcePage.offset` 分别拼接文件，验证完整 hash。静态 fixture 不等于后端或模型服务。
- `plan_installation`：只读计划固定 `@cwa-design/react@<确切版本>`。`publicationStatus: "not-verified"` 表示尚未核验 npm 发布，候选版使用审核后的本地 tarball 或源码。
- `get_migration`：只比较两份可用 Registry 契约；不推断未记录的实现变化。同版本仍校验该版本存在。

完整序列化 `CallToolResult`（包括 text 与 structuredContent）上限为 12 KiB。大源码与 Token 会分页；大型 API 要用 sections/part 缩小。不会静默裁掉代码。未知版本返回 `VERSION_NOT_FOUND`，非法 SemVer/游标返回 `INVALID_INPUT`，历史版本缺失源码/Token 返回 `REGISTRY_UNAVAILABLE`，不会借用新版本资料。结构化错误位于 `structuredContent.error`，同时设置 `isError: true`。

测试通过当前 MCP Client 2.2.0 与 legacy SDK Client 1.31.0 的 stdio 连接。
