import data from "virtual:cwa-site-data";
import { Dialog, IconButton, Surface, useCwaContext } from "@cwa-design/react";
import { type ReactNode, useEffect, useState } from "react";
import { Icon } from "../components/icons";
import { SearchDialog } from "../components/search";
import { catalog, categories, navItems } from "../data/catalog";
import { href, type SiteRoute } from "../routes";

const guideLinks = [
  [
    "指南",
    [
      ["开始使用", "/docs/getting-started/"],
      ["主题与配置", "/docs/theming/"],
      ["兼容与边界", "/docs/compatibility/"],
    ],
  ],
  [
    "设计语言",
    [
      ["设计原则", "/design/"],
      ["材质与层次", "/design/materials/"],
      ["响应与动效", "/design/motion/"],
      ["无障碍", "/design/accessibility/"],
    ],
  ],
  [
    "开发工具",
    [
      ["主题实验室", "/themes/"],
      ["界面组合", "/patterns/"],
      ["AI 入口", "/ai/"],
      ["Skill", "/ai/skill/"],
      ["MCP 与 CLI", "/ai/mcp/"],
    ],
  ],
  [
    "项目",
    [
      ["资源", "/resources/"],
      ["版本与更新", "/changelog/"],
    ],
  ],
] as const;
function Sidebar({ route }: { route: SiteRoute }) {
  const isComponents = route.kind === "components" || route.kind === "component";
  return (
    <aside className="site-sidebar" aria-label={isComponents ? "组件目录" : "文档目录"}>
      {isComponents ? (
        <>
          <a
            className={`sidebar-overview ${route.kind === "components" ? "is-current" : ""}`}
            href={href("/components/")}
          >
            组件总览 <span>{data.manifest.components.length}</span>
          </a>
          {categories.map((category) => (
            <div className="sidebar-group" key={category}>
              <p>{category}</p>
              {data.manifest.components
                .filter((component) => catalog[component.id]?.category === category)
                .map((component) => (
                  <a
                    href={href(`/components/${component.id}/`)}
                    key={component.id}
                    className={route.id === component.id ? "is-current" : ""}
                    aria-current={route.id === component.id ? "page" : undefined}
                  >
                    <span>{component.name}</span>
                    <small>{catalog[component.id]?.zh}</small>
                  </a>
                ))}
            </div>
          ))}
        </>
      ) : (
        guideLinks.map(([label, items]) => (
          <div className="sidebar-group" key={label}>
            <p>{label}</p>
            {items.map(([title, path]) => (
              <a
                key={path}
                href={href(path)}
                className={route.path === path ? "is-current" : ""}
                aria-current={route.path === path ? "page" : undefined}
              >
                {title}
              </a>
            ))}
          </div>
        ))
      )}
    </aside>
  );
}
export function SiteShell({
  route,
  children,
  toc = [],
}: {
  route: SiteRoute;
  children: ReactNode;
  toc?: { id: string; label: string }[];
}) {
  const context = useCwaContext();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);
  const home = route.kind === "home";
  return (
    <div className={`site-shell ${home ? "site-shell--home" : ""}`}>
      <a className="site-skip" href="#main">
        跳转到正文
      </a>
      <header className="site-header-wrap">
        <Surface material="glass" className="site-header">
          <a className="site-brand" href={href("/")} aria-label="CWA Design 首页">
            <img src={href("/favicon.svg")} width="29" height="29" alt="" />
            <span>CWA Design</span>
          </a>
          <nav className="site-primary-nav" aria-label="主导航">
            {navItems.map((item) => (
              <a
                href={href(item.path)}
                key={item.path}
                className={route.path.startsWith(item.path.replace(/\/$/, "")) ? "is-current" : ""}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="site-header-actions">
            <SearchDialog open={searchOpen} setOpen={setSearchOpen} />
            <a className="site-version" href={href("/changelog/")} title="当前源码候选">
              {__CWA_RELEASE__.version}
            </a>
            <IconButton
              label="切换网站主题"
              variant="ghost"
              size="sm"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("cwa-theme-change", {
                    detail:
                      context.resolvedTheme === "dark" || context.theme === "dark"
                        ? "light"
                        : "dark",
                  }),
                );
              }}
            >
              <Icon name="sun" size={18} />
            </IconButton>
            <a
              className="site-github"
              href="https://github.com/whyfail/cwa-design"
              aria-label="GitHub 源码"
            >
              <Icon name="github" size={19} />
            </a>
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <Dialog.Trigger
                render={
                  <IconButton
                    label="打开移动导航"
                    variant="ghost"
                    size="sm"
                    className="site-menu-button"
                  >
                    <Icon name="menu" />
                  </IconButton>
                }
              />
              <Dialog.Content material="solid" className="site-mobile-menu">
                <Dialog.Title>浏览 CWA Design</Dialog.Title>
                <Dialog.Description className="site-sr-only">官网栏目与文档目录</Dialog.Description>
                <Dialog.Close
                  render={
                    <IconButton
                      label="关闭移动导航"
                      variant="ghost"
                      size="sm"
                      className="site-menu-close"
                    >
                      <Icon name="close" />
                    </IconButton>
                  }
                />
                <nav aria-label="移动导航">
                  {navItems.map((item) => (
                    <a href={href(item.path)} key={item.path}>
                      {item.label}
                      <Icon name="arrow" size={18} />
                    </a>
                  ))}
                  <a href={href("/patterns/")}>
                    界面组合
                    <Icon name="arrow" size={18} />
                  </a>
                  <a href={href("/search/")}>
                    搜索文档
                    <Icon name="search" size={18} />
                  </a>
                </nav>
                <Sidebar route={route} />
              </Dialog.Content>
            </Dialog>
          </div>
        </Surface>
      </header>
      {home ? (
        <main id="main">{children}</main>
      ) : (
        <div className={`site-doc-layout ${toc.length ? "site-doc-layout--toc" : ""}`}>
          <Sidebar route={route} />
          <main id="main" className="site-doc-main">
            {children}
          </main>
          {toc.length ? (
            <aside className="site-toc" aria-label="本页目录">
              <p>本页内容</p>
              {toc.map((item) => (
                <a key={item.id} href={`#${item.id}`}>
                  {item.label}
                </a>
              ))}
              <a className="toc-markdown" href={href(`/markdown${route.path}index.md`)}>
                Markdown ↗
              </a>
            </aside>
          ) : null}
        </div>
      )}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="site-brand" href={href("/")}>
              <img src={href("/favicon.svg")} width="26" height="26" alt="" />
              CWA Design
            </a>
            <p>
              轻盈的玻璃。
              <br />
              清晰的设计，真实的组件。
            </p>
          </div>
          <div>
            <h3>开发</h3>
            <a href={href("/docs/getting-started/")}>开始使用</a>
            <a href={href("/components/")}>组件总览</a>
            <a href={href("/patterns/")}>界面组合</a>
            <a href={href("/storybook/")}>Storybook ↗</a>
          </div>
          <div>
            <h3>设计</h3>
            <a href={href("/design/materials/")}>材质与层次</a>
            <a href={href("/design/motion/")}>响应与动效</a>
            <a href={href("/themes/")}>主题实验室</a>
          </div>
          <div>
            <h3>AI 与项目</h3>
            <a href={href("/ai/skill/")}>Skill</a>
            <a href={href("/ai/mcp/")}>MCP 与 CLI</a>
            <a href={href("/resources/")}>下载资源</a>
            <a href="https://github.com/whyfail/cwa-design">GitHub ↗</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date(data.manifest.generatedAt).getUTCFullYear()} CWA Design · MIT</span>
          <span>
            {__CWA_RELEASE__.version} · {__CWA_RELEASE__.dirty ? "工作区候选" : "源码构建"} · 基线{" "}
            {__CWA_RELEASE__.commit.slice(0, 7)}
          </span>
          <a href={href("/changelog/")}>版本与更新</a>
        </div>
      </footer>
    </div>
  );
}
