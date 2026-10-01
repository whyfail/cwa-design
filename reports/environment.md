# 环境诊断报告（T00）

日期：2026-10-02（Asia/Shanghai） · 模型：GLM-5.3-Flash · 执行环境：ZCode agent

## 实际读取的资料

1. `/Users/wulei/Desktop/CWA-Design-开发方案/`（README、01 主计划、02 任务清单、03 启动提示词、04 版本核验 JSON）
2. `/Users/wulei/.zcode/AGENTS.md`（RTK shell 政策）与 `/Users/wulei/Desktop/wl/AGENTS.md`（工作区可靠性规范）
3. npm 官方 registry（28 个方案包 + 4 个补充包 latest 逐一重查）
4. `https://nodejs.org/dist/index.json`（v24 LTS 最新为 v24.21.0，lts 代号 Krypton）

## 环境事实

| 项 | 值 |
| --- | --- |
| OS | macOS 26.6.2，arm64 |
| CPU / 内存 | 10 核 / 16 GB |
| Node | **24.21.0**（nvmd 4.4.0 安装切换；原为 24.18.0） |
| pnpm | **12.8.1**（corepack 0.36.0 按 `packageManager` 字段提供；另以 devDependency exact pin 到根） |
| Shell 政策 | RTK 0.48.0，全部命令经 `rtk` / `rtk proxy` 执行 |
| npm registry | `https://registry.npmjs.org/`（用户配置，未改动） |
| git | 2.54.0（Apple Git-157） |
| 浏览器测试条件 | 本机 Safari/Chrome 可用；本阶段未启动浏览器，Playwright 未安装 |

## 版本核验结论

- 28 个方案核验包的 `latest` 与方案快照（2026-10-01）**全部一致**，零偏差。
- 方案未覆盖的 4 个补充包按 2026-10-02 registry latest 记录：jsdom 30.1.1、@testing-library/jest-dom 7.0.1、@eslint/js 10.0.1、@types/node 24.19.0（取 24.x 线匹配运行时）。
- `latest` 不作为兼容证据；兼容性结论见 T02（`reports/tasks/T02.md` 与 ADR-0001/0002）。

## GLM 宿主能力

- 宿主（ZCode agent）具备：多步工具调用（shell/文件/子代理）、读写图片能力、后台任务。
- stdio MCP 连接为真实进程测试（见 T02 MCP 段），通过。
- 本阶段未调用 GLM HTTP API，未接触任何 API key；报告中不含敏感配置值。

## 项目目录决策

- 用户指示"新建一个 cwa-design 文件夹"，当前工作目录为 `/Users/wulei/Desktop/wl/cwa`。
- 据此创建 **`/Users/wulei/Desktop/wl/cwa/cwa-design`**（主计划建议的 `/Users/wulei/Desktop/wl/CWA-Design` 变体；独立新仓，不触碰 `cwa/` 下既有工程文件）。
- 已确认 `cwa/` 现有内容（cwa-docs、cwa-stack、vite_*_init 等）未被修改。

## 待维护者确认

1. npm scope `@cwa-design/*` 与许可证（当前 `license: UNLICENSED`，仅本地）。
2. Node 24.21.0 作为全仓最低开发基线（engines `>=24.0.0`）是否收紧为 exact。
