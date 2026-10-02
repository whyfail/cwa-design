import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CwaProvider,
  Field,
  Input,
  SettingsRecipe,
  Stack,
  Text,
  type ThemePreference,
} from "@cwa-design/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@cwa-design/react/styles.css";

type Page = "start" | "components" | "theming" | "ai";

function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: "color-mix(in srgb, var(--cwa-design-color-text) 6%, transparent)",
        padding: "var(--cwa-design-space-4)",
        borderRadius: "var(--cwa-design-radius-control)",
        overflowX: "auto",
        fontSize: "var(--cwa-design-font-size-caption)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </pre>
  );
}

function StartPage() {
  return (
    <Stack gap={5}>
      <h2 style={{ fontWeight: 590, fontSize: "1.5rem", margin: 0 }}>开始使用</h2>
      <Card>
        <CardTitle>1 · 安装</CardTitle>
        <CardContent>
          <Code>{`pnpm add @cwa-design/react`}</Code>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>2 · 引入样式（一次）</CardTitle>
        <CardContent>
          <Code>{`import "@cwa-design/react/styles.css";`}</Code>
          <Text variant="caption" tone="muted">
            内含全部设计 tokens（light/dark、材质、动效），无需额外 Tailwind 编译。
          </Text>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>3 · 配置 Provider 并组合组件</CardTitle>
        <CardContent>
          <Code>{`import { CwaProvider, Button } from "@cwa-design/react";

<CwaProvider theme="system" material="auto" motion="system" locale="zh-CN">
  <Button variant="primary">保存</Button>
</CwaProvider>`}</Code>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>4 · 查询组件契约（AI 友好）</CardTitle>
        <CardContent>
          <Code>{`cwa-design inspect button --json
# 或 MCP: cwa_design_get_component { id: "button" }`}</Code>
          <Text variant="caption" tone="muted">
            契约与已装版本绑定；不存在的 props/import 会被工具明确拒绝。
          </Text>
        </CardContent>
      </Card>
    </Stack>
  );
}

function ComponentsPage() {
  const [saved, setSaved] = useState("");
  return (
    <Stack gap={5}>
      <h2 style={{ fontWeight: 590, fontSize: "1.5rem", margin: 0 }}>
        组件（P0 · 30 个，可交互 demo）
      </h2>
      <Card>
        <CardTitle>Button</CardTitle>
        <CardDescription>
          原生 button 语义；pointer-down 即时反馈；loading 禁交互并声明 aria-busy。
        </CardDescription>
        <CardContent>
          <Stack direction="row" gap={3}>
            <Button variant="primary">主操作</Button>
            <Button variant="secondary">次要</Button>
            <Button variant="ghost">幽灵</Button>
            <Button variant="danger">危险</Button>
            <Button variant="primary" loading>
              提交中
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>Field + Input</CardTitle>
        <CardContent>
          <Field
            label="邮箱"
            description="工作登录邮箱"
            {...(saved ? {} : { error: "必填项示例" })}
          >
            <Input placeholder="you@example.com" />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>Badge / 通知</CardTitle>
        <CardContent>
          <Stack direction="row" gap={3}>
            <Badge tone="accent">Beta</Badge>
            <Badge tone="success" max={99}>
              {120}
            </Badge>
            <Badge tone="danger">已到期</Badge>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>Recipe：个人设置</CardTitle>
        <CardContent>
          <SettingsRecipe onSave={(values) => setSaved(values.displayName)} />
          {saved ? (
            <Text variant="caption" tone="muted">
              最近保存：{saved}
            </Text>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}

function ThemingPage() {
  return (
    <Stack gap={5}>
      <h2 style={{ fontWeight: 590, fontSize: "1.5rem", margin: 0 }}>主题与材质</h2>
      <Card>
        <CardTitle>材质决策</CardTitle>
        <CardContent>
          <Stack gap={3}>
            <Text>
              regular glass 只用于浮动控件与导航层；正文/表单/Card 默认 solid 或 frosted。
            </Text>
            <Text>
              玻璃层上的浮层必须 solid（禁止 glass-on-glass）；clear 玻璃仅媒体控件显式启用。
            </Text>
            <Text variant="caption" tone="muted">
              系统 reduced-motion / reduced-transparency / 强对比 优先于一切显式设置。
            </Text>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>Provider 属性</CardTitle>
        <CardContent>
          <Code>{`<CwaProvider
  theme="system"        // light | dark | system（浏览器内切换右上角演示）
  material="auto"       // auto | solid（强制实色）
  motion="system"       // system | reduced | full（不覆盖系统 reduce）
  locale="zh-CN"
>`}</Code>
        </CardContent>
      </Card>
    </Stack>
  );
}

function AiPage() {
  return (
    <Stack gap={5}>
      <h2 style={{ fontWeight: 590, fontSize: "1.5rem", margin: 0 }}>AI 接入</h2>
      <Card>
        <CardTitle>单一事实来源</CardTitle>
        <CardContent>
          <Text>
            组件契约、示例与 recipes 全部来自 registry manifest（含 SHA-256 digest），CLI、MCP 与
            Skill 消费同一份数据；契约与已装版本绑定。
          </Text>
        </CardContent>
      </Card>
      <Card>
        <CardTitle>三条接入路径</CardTitle>
        <CardContent>
          <Code>{`1. CLI（无 MCP 宿主）:  cwa-design inspect select --json
2. MCP:                 cwa_design_get_component { id: "select", version: "<已装版本>" }
3. Skill:               skills/cwa-design/SKILL.md + references/`}</Code>
        </CardContent>
      </Card>
    </Stack>
  );
}

function App() {
  const [page, setPage] = useState<Page>("start");
  const [theme, setTheme] = useState<ThemePreference>("light");
  return (
    <CwaProvider theme={theme} locale="zh-CN">
      <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "2rem 1rem" }}>
        <header
          style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}
        >
          <strong>CWA Design</strong>
          <Badge tone="accent">0.1.0-alpha.0</Badge>
          <nav
            style={{ display: "flex", gap: "0.5rem", marginInlineStart: "auto", flexWrap: "wrap" }}
          >
            {(
              [
                ["start", "开始"],
                ["components", "组件"],
                ["theming", "主题"],
                ["ai", "AI 接入"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                variant={page === key ? "primary" : "ghost"}
                onClick={() => setPage(key)}
              >
                {label}
              </Button>
            ))}
            <Button
              variant="secondary"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="切换深浅主题"
            >
              {theme === "dark" ? "浅色" : "深色"}
            </Button>
          </nav>
        </header>
        <main>
          {page === "start" ? (
            <StartPage />
          ) : page === "components" ? (
            <ComponentsPage />
          ) : page === "theming" ? (
            <ThemingPage />
          ) : (
            <AiPage />
          )}
        </main>
        <footer style={{ marginTop: "3rem" }}>
          <Text variant="caption" tone="muted">
            Alpha 候选 · React 首发 · 本站由 @cwa-design/react 自身构建
          </Text>
        </footer>
      </div>
    </CwaProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
