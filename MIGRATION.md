# 迁移指南

## 0.0.0（未发布）→ 0.1.0-alpha.0

首个公开版本，无迁移需求。所有公共 API 均为新增。

### 安装

```bash
pnpm add @cwa-design/react
```

### 最小接入

```tsx
import { CwaProvider, Button } from "@cwa-design/react";
import "@cwa-design/react/styles.css"; // 全局引入一次（含设计 tokens）

<CwaProvider theme="system" material="auto" motion="system" locale="zh-CN">
  <Button variant="primary">保存</Button>
</CwaProvider>
```

### Alpha API 稳定性说明

- `0.1.0-alpha.x` 期间公共 API 可能调整；breaking 变更会在此文件与 changeset 中记录。
- 组件契约以 registry manifest 为准（`packages/registry/dist/manifest/react/<版本>/manifest.json`，
  可经 `cwa-design inspect <id>` 或 MCP `cwa_design_get_component` 查询）。
- Sheet 当前为单展开位 + 拖动关闭；多 snap points 为后续 API（非 breaking 预告）。
- 消费者 typecheck 需为 CSS 副作用导入提供 bundler 类型（如 tsconfig `"types": ["vite/client"]`）。

### 升级检查清单

1. `cwa-design doctor` 确认环境。
2. 对照 `COMPATIBILITY.md` 的 Node/pnpm/React 要求。
3. 若使用 MCP/Skill：确认工具返回的 `libraryVersion` 与已装包一致，不混用新版本 API。
