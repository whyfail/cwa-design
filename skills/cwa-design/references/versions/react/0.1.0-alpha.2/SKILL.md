---
name: cwa-design
description: Build and review CWA Design interfaces using the exact installed version, verified component contracts, source examples, material rules and accessibility behavior.
---

# CWA Design

React 组件库的应用开发技能。先确认已安装版本，再查同版本契约与真实源码。

## 使用流程

1. 读取应用 package.json 与 lockfile，确认 React 和 @cwa-design/react 的确切发行版本；范围值不能作为已安装版本。
2. 检查 references/overview.md 与 references/index.json 的 libraryVersion。版本不符时使用 references/versions/react/<version>/references，或用 MCP 查询该确切版本；都没有时明确缺失并停止生成依赖未知 API 的代码。
3. 从 references/components.md 选组件；按需读取 contracts/<id>.json。props 是 CWA 自有属性及明确标注的实现默认值，extends 是完整继承类型；compoundParts 单独描述子部件。完整 TS 声明仍是类型权威。
4. 复用 examples.json 指向的已编译 TSX；读取 examples/<id>.tsx 的实际代码，并用 index.json 的 SHA-256 校验原始文件字节。配方见 recipes.json 与 recipes/*.tsx，先读 limitations；静态 fixture 不代表接好业务。
5. 不发明 exports、props、默认值、业务后端或已完成的验证。material 写在有此属性的部件上，例如 Dialog.Content 或 PopoverContent，不能写在 Root。
6. floating toolbar/navigation/独立 Popover 用 regular glass；正文、表单与 Card 用 solid/frosted。控件共享玻璃壳而不独立叠 blur；覆盖实际玻璃背景时依据可读性加厚或显式 solid。clear 只在媒体控件显式启用。
7. Provider material="solid" 与系统回退优先；保留 reduced-motion/reduced-transparency/forced-colors、可见焦点、label 与键盘操作。motion="full" 不能覆盖系统减少动态偏好。
8. 生成可审查补丁，沿用现有工程包管理器。先说明具体改动范围与会运行的检查；只有 CLI init --apply 会写配置，MCP 工具只读。
9. 运行相关类型、构建、行为与浏览器检查。如实报告失败和未运行项；不得把自动检查通过写成维护者视觉或宿主人工验收通过。

## 安装与样式

先确认该版本的真实渠道。若尚未发布 npm，使用项目 release 提供的本地同版本 tarball/工作区；不能声称 npm 命令已经可用。
已发布时安装确切版本，例如 `pnpm add @cwa-design/react@<exact_version>`。不要使用 latest 或不固定版本的建议。

```tsx
import "@cwa-design/react/styles.css";
import { CwaProvider } from "@cwa-design/react";

<CwaProvider theme="system" material="auto" motion="system" locale="zh-CN">
  {children}
</CwaProvider>
```

样式在入口引入一次。基础例子默认依赖应用根 CwaProvider；无需为每个例子再嵌套 provider。
Field.required 只显示标记；原生表单校验仍需在 Input/Textarea 等控件上传 required。
ToastProvider 的 toastManager 是可选的 Base UI 属性；外部触发时可 createToastManager() 并注入，同一 Provider 内可使用 useToastManager()。
Sheet 当前是单展开位，没有 snapPoints；Slider 的 CWA 组合当前只渲染一个 Thumb。

## MCP 查询

先调用 cwa_design_get_capabilities，读取 libraryVersion、registryVersions、registryDigest 与各版本产物能力，再为每个查询传入确切安装版本。查询结果返回 libraryVersion；manifest digest 由 capabilities 提供，不宣称每个工具都有 registryDigest。
完整序列化工具结果的总预算为 12 KiB（含 text 与 structuredContent）。大型组件契约用 `sections: ["api"]` 与 `part: "root"` 查询根属性，再按 availableParts 查询复合部件，例如 `part: "SelectContent"`；a11y/material/examples 可单独查询。超预算返回 INVALID_INPUT 与缩小查询说明，不会静默丢弃 API。
示例与配方源码用 nextCursor 连续查询同一版本/id，将 source 按 sourcePage.offset 拼接；offset 单位为 Unicode 字符。配方 sources 按 file 分组拼接，包含 recipe-scope.tsx 等列出的依赖文件。sourcePage.chunkDigest 校验当前片段，artifact.contentDigest 校验完整文件；不能只复制第一页就当作完整代码。
Token 用 `theme: "all"` 获取双主题，或用 groups 限定；按 nextCursor 继续，将同组各页按 group/key 合并。搜索 cursor 绑定原 query 与版本，换查询时重新开始。MCP 目前提供八个只读 tools，完整资料通过工具分页或此 Skill references 获取。
未知版本返回 VERSION_NOT_FOUND，不会降级到最新；旧快照缺源码/Token 时返回 REGISTRY_UNAVAILABLE，不能混用其他版本文件。

## 无 MCP 时

此 Skill 随 references/contracts、examples、recipes、tokens 与 hash index 分发，离线可用。仅使用匹配已安装版本的参考文件；旧版本缺完整源码时如实说明。
