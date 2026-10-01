# ADR-0004：MCP TypeScript SDK 2.2.0 API 形态（相对 1.x 的变化）

状态：accepted（T02 实测：current 2.2.0 与 legacy 1.31.0 客户端均通过） · 日期：2026-10-02

## 背景

主计划 §15 指定 server/client SDK 2.2.0、主协议 2026-07-28、`serveStdio(factory, { legacy: 'serve' })`。
2.2.0 将 server/client 拆分为 `@modelcontextprotocol/server` / `@modelcontextprotocol/client`，
共享 `@modelcontextprotocol/core`；API 相对 1.x 有实质变化，以下为读包类型与运行实测确认的形态。

## 决策（按 2.2.0 实际 API 编码）

| 项 | 1.x（旧教程写法） | 2.2.0 实际 |
| --- | --- | --- |
| server 导入 | `@modelcontextprotocol/sdk/server/mcp.js` | `@modelcontextprotocol/server`（根导出 `McpServer`） |
| stdio | `.../server/stdio.js` 的 `StdioServerTransport` | `@modelcontextprotocol/server/stdio` 导出 `serveStdio` / `StdioServerTransport` |
| serveStdio 参数 | `serveStdio(serverInstance)` | `serveStdio(factory, options?)`，factory 为 `McpServerFactory`；连接期 pin 一个实例；返回 `StdioServerHandle`（同步句柄，`close(): Promise<void>`） |
| legacy 兼容 | — | `ServeStdioOptions.legacy: 'serve'(默认) \| 'reject'`；`'serve'` 使 2025-era 客户端（1.31.0，协议 2025-11-25）正常工作 |
| registerTool inputSchema | raw shape（`{ field: z.string() }`） | 推荐 `z.object({...})`（StandardSchemaWithJSON）；raw shape 已标 deprecated |
| client 导入 | `@modelcontextprotocol/sdk/client/index.js` | 当前客户端 `@modelcontextprotocol/client`（根）/ `@modelcontextprotocol/client/stdio` |

## 实测结果

- `node dist/index.js` stdio server + 当前 client 2.2.0：`listTools`、`callTool`（含 `structuredContent`）通过。
- 同一 server + legacy client 1.31.0：`listTools`、`callTool`（TextContent JSON）通过 —— `legacy: 'serve'` 兼容成立，无需自写两套协议。
- stdout 仅协议数据（日志走 stderr 的纪律在 T29 正式工具集中以测试固化）。

## 影响

- T29 实现 8 个只读工具时直接采用以上形态；`structuredContent` 优先、TextContent 同步镜像。
- 输入校验用 zod 4（Standard Schema），不用 raw-shape deprecated 形式。
