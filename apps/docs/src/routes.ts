import data from "virtual:cwa-site-data";
import { catalog } from "./data/catalog";

export interface SiteRoute {
  path: string;
  title: string;
  description: string;
  kind:
    | "home"
    | "guide"
    | "components"
    | "component"
    | "design"
    | "themes"
    | "patterns"
    | "pattern"
    | "ai"
    | "resources"
    | "changelog"
    | "search"
    | "not-found";
  id?: string;
  keywords: string[];
}
const page = (
  path: string,
  title: string,
  description: string,
  kind: SiteRoute["kind"],
  keywords: string[] = [],
): SiteRoute => ({ path, title, description, kind, keywords });
export const routes: SiteRoute[] = [
  page(
    "/",
    "CWA Design — 轻盈的玻璃，完整的组件",
    "Apple 风格的 Web 组件库。真实 React 组件、清晰文档、可运行示例与同版本 AI 契约。",
    "home",
    ["首页"],
  ),
  page(
    "/docs/getting-started/",
    "开始使用",
    "从现有源码 workspace 开始，构建组件、引入样式并配置 CwaProvider。",
    "guide",
    ["安装", "上手", "install", "quickstart"],
  ),
  page(
    "/docs/theming/",
    "主题与配置",
    "使用 CwaProvider 配置主题、材质、密度和动效，用公开 CSS Token 定制品牌。",
    "guide",
    ["主题", "theme", "配置", "token"],
  ),
  page(
    "/docs/compatibility/",
    "兼容与使用边界",
    "React、SSR、样式入口与 Alpha 支持范围，以及浏览器降级策略。",
    "guide",
    ["SSR", "React", "兼容", "浏览器"],
  ),
  page(
    "/components/",
    "组件总览",
    `${data.manifest.components.length} 个真实 React 组件，按界面任务选择，查看同源示例和 API。`,
    "components",
    ["组件", "component", "目录"],
  ),
  ...data.manifest.components.map(
    (component): SiteRoute => ({
      path: `/components/${component.id}/`,
      title: `${component.name} ${catalog[component.id]?.zh ?? ""}`.trim(),
      description: component.description ?? catalog[component.id]?.description ?? component.name,
      kind: "component",
      id: component.id,
      keywords: [component.id, component.name, ...(catalog[component.id]?.keywords ?? [])],
    }),
  ),
  page(
    "/design/",
    "设计语言",
    "轻盈、清晰和可预测：CWA Design 的材质、空间、排版与交互原则。",
    "design",
    ["设计", "Apple", "玻璃"],
  ),
  page(
    "/design/materials/",
    "材质与层次",
    "选择 solid、frosted、glass 与 glass-clear，用真实背景验证透射与文字可读性。",
    "design",
    ["玻璃", "材质", "glass", "透明"],
  ),
  page(
    "/design/motion/",
    "响应与动效",
    "即时按下反馈、可中断弹簧与速度延续，以及减少动态偏好。",
    "design",
    ["动效", "motion", "spring", "手势"],
  ),
  page(
    "/design/glass-candidates/",
    "玻璃候选对照",
    "79168ce Token 与 0.1.0-alpha.3 候选的同条件 A/B：真实照片、滚动文字、三种材质。",
    "design",
    ["玻璃", "候选", "A/B", "Token"],
  ),
  page(
    "/design/accessibility/",
    "无障碍设计",
    "可访问名称、键盘操作、焦点、表单关联与用户偏好的使用规范。",
    "design",
    ["无障碍", "键盘", "焦点", "a11y"],
  ),
  page(
    "/themes/",
    "主题实验室",
    "在同一组件组上比较材质与背景，导出真实 CwaProvider 配置和公开 Token。",
    "themes",
    ["主题", "实验室", "玻璃", "定制", "theme"],
  ),
  page(
    "/patterns/",
    "界面组合",
    "用已有组件组织设置、账户面板与 AI 工作台，查看真实源码和交互边界。",
    "patterns",
    ["组合", "recipe", "patterns"],
  ),
  ...data.manifest.recipes.map(
    (recipe): SiteRoute => ({
      path: `/patterns/${recipe.id}/`,
      title: recipe.title,
      description: `可运行的 ${recipe.id} 组合，与真实源码和组件契约对应。`,
      kind: "pattern",
      id: recipe.id,
      keywords: [recipe.id, "组合", "recipe", ...recipe.components],
    }),
  ),
  page(
    "/ai/",
    "为 AI 开发而设计",
    "Skill、版本化 Registry、只读 CLI 与本地 stdio MCP 共享同一份组件契约。",
    "ai",
    ["AI", "人工智能", "模型", "Agent"],
  ),
  page(
    "/ai/skill/",
    "CWA Design Skill",
    "下载包含组件契约和设计规则的同版本 Skill，供 AI 编程助手按真实 API 工作。",
    "ai",
    ["Skill", "技能", "AI"],
  ),
  page(
    "/ai/mcp/",
    "MCP 与 CLI",
    "从源码 workspace 启动本地 stdio MCP，查询确切版本的组件、Token 与示例。",
    "ai",
    ["MCP", "工具", "CLI", "AI"],
  ),
  page(
    "/resources/",
    "资源",
    "真实版本的 Registry、Token、Skill 与逐页 Markdown，以及源码和 Storybook 入口。",
    "resources",
    ["下载", "资源", "resource"],
  ),
  page("/changelog/", "版本与更新", "当前 Alpha 候选、已部署版本和本轮变更范围。", "changelog", [
    "版本",
    "更新",
    "changelog",
  ]),
  page("/search/", "搜索文档", "按组件名、中文别名和使用场景搜索 CWA Design。", "search", [
    "搜索",
    "search",
  ]),
  page("/404.html", "页面未找到", "返回 CWA Design 首页或查找组件。", "not-found"),
];
export function href(path: string, base = import.meta.env.BASE_URL): string {
  return `${base.endsWith("/") ? base : `${base}/`}${path.replace(/^\//, "")}`;
}
export function routeFromPath(path: string, base: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  if (path === normalizedBase.slice(0, -1)) return "/";
  const relative =
    normalizedBase === "/"
      ? path
      : path.startsWith(normalizedBase)
        ? `/${path.slice(normalizedBase.length)}`
        : "/404.html";
  const normalized =
    relative.endsWith("/") || relative.endsWith(".html") ? relative : `${relative}/`;
  return routes.some((route) => route.path === normalized) ? normalized : "/404.html";
}
export function getRoute(path: string): SiteRoute {
  const route =
    routes.find((item) => item.path === path) ?? routes.find((item) => item.kind === "not-found");
  if (!route) throw new Error("404 route is missing");
  return route;
}
export function searchRoutes(query: string): SiteRoute[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term)
    return routes.filter((route) =>
      [
        "/docs/getting-started/",
        "/components/button/",
        "/components/dialog/",
        "/themes/",
        "/ai/mcp/",
      ].includes(route.path),
    );
  return routes
    .filter(
      (route) => route.kind !== "not-found" && route.kind !== "home" && route.kind !== "search",
    )
    .map((route) => {
      const words = [route.title, ...(route.keywords ?? [])].map((word) =>
        word.toLocaleLowerCase(),
      );
      const score = words.some((word) => word === term)
        ? 10
        : words.some((word) => word.startsWith(term))
          ? 7
          : words.some((word) => word.includes(term))
            ? 5
            : route.description.toLocaleLowerCase().includes(term)
              ? 1
              : 0;
      return { route, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.route.path.localeCompare(b.route.path))
    .map((result) => result.route)
    .slice(0, 12);
}
