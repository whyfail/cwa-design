# CWA Design 优化实施报告

2026-10-03。React `0.1.0-alpha.1` 的玻璃组件与正式官网已提交并部署至 GitHub Pages。本次未执行 npm 发布。

线上：[正式官网](https://whyfail.github.io/cwa-design/) · [组件目录](https://whyfail.github.io/cwa-design/components/) · [主题实验室](https://whyfail.github.io/cwa-design/themes/) · [视觉前后对照](visual-review.html)。

## 本次部署与线上验证

源提交 [8f394b8](https://github.com/whyfail/cwa-design/commit/8f394b8eae01b948432a2186cc62e01909b65c43)，[Pages运行37133033123](https://github.com/whyfail/cwa-design/actions/runs/37133033123) 成功，线上 release.json 的 commit/version/digest 匹配且 dirty=false。

发布前新增干净构建的历史 Registry 校验，单元测试增至139（Registry36）；全仓类型检查与全新检出生产构建通过，构建后Git干净。线上276独立GET覆盖51 HTML/30详情/50 Markdown/66 Registry产物及真实404；三引擎132交互、144 axe扫描通过（serious/critical=0）。实际点击下载的React tgz独立安装、类型检查、Vite client/SSR和公共CSS/exports消费通过；Skill包当前和历史177条引用字节/hash校验通过。

原始证据：[部署汇总](deployment-results.json)、[线上浏览器](online-browser-results.json)、[线上路由与资源](online-http-results.json)、[线上包消费](online-tarball-results.json)、[Skill包完整性](online-skill-results.json)。Storybook有19组件映射至18独立故事，其他11组件链接根入口；不宣称30独立Storybook故事。人工接受和设备/读屏边界保持原记录。

## 本轮交付

- 公共材质包含真实背景采样、定向反射、rim、内高光/阴影、接触与环境投影，提供 Regular/Thick/Clear 与 solid 回退。官网和 tarball 使用同一公共 CSS；没有官网私有玻璃替代库效果。
- 完整八段品牌首页、三栏文档、移动导航、搜索、30 个组件详情，共 51 个真实静态 HTML 路由。示例、源码、API、Token、无障碍说明、Storybook 与下载入口可用。
- 主题实验室、Settings/Account/AIWorkspace 三个可操作 patterns；浅深主题和系统偏好贯穿页面与 Portal。
- 单一版本 Registry、离线 Skill、8 个只读 stdio MCP tools，exact version/hash/分页和源码查询；没有假 npm 安装、远程 MCP 服务、Vue 支持或模型后端。
- 修复移动导航层级、Slider 可访问名称及深色活动部件、WebKit focus guard 名称、Field 辅助说明关联、移动搜索名称、代码滚动键盘入口与状态色对比。

## 部署前本地验证（原始证据保留）

| 检查 | 结果 |
|---|---|
| 完整构建、全仓类型检查、strict ESLint、diff whitespace | 退出 0 |
| 单元测试 | 134 通过：Tokens10 / Registry31 / CLI17 / React76 |
| MCP stdio | 当前2.2.0 + legacy1.31.0，均验证8个tools |
| 正式官网三引擎 | Chrome154 / Firefox153 / WebKit26.5，共132场景通过；无pageerror/HTTP错误 |
| axe 4.13.0 | 144扫描，serious/critical=0；非模态菜单/选择器 Portal 仍有moderate region提示 |
| 响应式 | 375/768/1024/1440px，五页×两主题共40状态，无全页横向溢出 |
| 公共材质 | 三引擎嵌套light/solid、深色、390px；Chromium额外减少透明实测 |
| Sheet | 独立三引擎15场景，RTL/reduced、整面板移动、取消/滚动/关闭替代 |
| 实际合成文字对比 | 四个默认Regular/Clear浅深场景36处标签，最低5.79:1 |
| 实际tarball消费者 | 独立temp安装、无workspace/source alias；TS7、Vite client/SSR、公共导出/CSS和HTTP通过 |
| 静态站门 | 51 HTML / 30组件，内部链接、锚点、资源、标题/H1/canonical均无错误 |

合成对比取样只检查默认山水 SVG / 高频棋盘场景的选定标签；axe 的渐变/图片背景 incomplete 保留。这不等于所有照片、应用背景或完整 WCAG/读屏验收。

部署前本地官网主 JS `367,341` B（gzip `115,123` B）；主 CSS `80,005` B（gzip `11,740` B）。旧主 JS 为317.89kB（gzip102.12kB），增加来自正式导航/搜索/主题与页面结构；完整 contracts/source 已从客户端公共大包移到逐页静态数据，重型demo按需加载。这里是主入口文件大小，不是完整首屏网络负载，也不是性能评分。

## 可核对产物

- React tgz：`apps/docs/dist/downloads/cwa-design-react-0.1.0-alpha.1.tgz`，50,015 B，108条目。
- tarball SHA256：`sha256:cb94d9f222374cfd140d9a66c5208d9651979687829cdab66d70be8b28d48230`。
- Registry SHA256：`sha256:26fc17e480ae582f1defb1ec332034ee9e15e5e9a58f273468ea93ba1f678a48`。
- 优化前基线：`99639df5f3c96f3181ec69a9b2af18cab1aa744c`；线上源提交为 `8f394b8eae01b948432a2186cc62e01909b65c43`，`release.json` 为 dirty=false/source。
- 每条任务和原始证据：`reports/optimization/R00.md`–`R23.md`；`tasks/status.json` 的 R23 已按线上自动证据标记 verified，未将人工接受填写为完成。

## 审查与发布边界

候选已上线，也可在本机预览。仍需维护者实际视觉接受、真实Safari/iOS触摸与固定设备性能、人工读屏和更多真实内容背景审查；全组件逐状态视觉矩阵与多版本官网切换也尚未全部完成。当前只有一套候选官网，历史 Registry 快照不等于历史官网。

Apple Liquid Glass 以 Web CSS 做 L2 材质近似，未启用跨浏览器真实折射/WebGL，也没有宣称与原生 Apple 渲染等价。Vue 属后续阶段。

用户授权“提交，部署”后，已提交源码并推送main，完成Pages部署与真实线上深链/主题/搜索/demo/下载复测。随后仅提交reports/tasks的发布证据，线上仍标识实际部署源提交8f394b8；这些证据更新不会重复部署。npm发布属于独立步骤，本次未执行。

## 重现检查

本机命令全部使用 RTK + nvmd，未改变全局 Node 或升级锁文件：

```bash
rtk proxy env NVMD_NODE_VERSION=24.21.0 CWA_BASE=/cwa-design/ STORYBOOK_BASE=/cwa-design/storybook/ corepack pnpm run verify
rtk proxy env NVMD_NODE_VERSION=24.21.0 corepack pnpm run typecheck
rtk proxy env CWA_BASE=/cwa-design/ python3 scripts/verify-static-site.py
rtk proxy env NVMD_NODE_VERSION=24.21.0 node scripts/verify-tarball-consumer.mjs
```

浏览器脚本需配置 `CWA_PLAYWRIGHT_MODULE`（本机Playwright1.62.1），Chrome channel通过 `CWA_CHROMIUM_CHANNEL=chrome`；Firefox/WebKit专用QA缓存已安装。axe脚本读取 `/tmp/cwa-design-qa-current-path.txt` 指向的axe-core4.13.0目录。脚本见 `scripts/verify-{docs,material,responsive}-browser.mjs` 与 `verify-composite-contrast.mjs`；这些机器路径不表示项目新增了Playwright生产依赖。
