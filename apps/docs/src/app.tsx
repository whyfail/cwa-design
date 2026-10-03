import { CwaProvider, type ThemePreference } from "@cwa-design/react";
import { useEffect, useState } from "react";
import { SiteShell } from "./layouts/site-shell";
import { ArticlePage, PageIntro } from "./pages/articles";
import { ComponentPage, ComponentsPage } from "./pages/components";
import { HomePage } from "./pages/home";
import { ThemesPage } from "./pages/themes";
import { PatternsPage } from "./pages/patterns";
import { SearchPage } from "./components/search";
import { getRoute, href } from "./routes";

const componentToc = [
  "import:引入",
  "examples:交互示例",
  "api:API",
  "material:材质与状态",
  "tokens:关联 Token",
  "accessibility:无障碍",
  "related:相关组件",
].map((value) => {
  const [id = "", label = ""] = value.split(":");
  return { id, label };
});
export function App({ route: path }: { route: string }) {
  const route = getRoute(path);
  const [theme, setTheme] = useState<ThemePreference>("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cwa-theme");
      if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
    } catch {
      /* Private browsing may disallow storage. */
    }
    const change = (event: Event) => {
      const value: unknown = (event as CustomEvent).detail;
      if (value === "light" || value === "dark" || value === "system") {
        setTheme(value);
        try {
          localStorage.setItem("cwa-theme", value);
        } catch {
          /* Preference still works for this page. */
        }
      }
    };
    window.addEventListener("cwa-theme-change", change);
    return () => window.removeEventListener("cwa-theme-change", change);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.cwaTheme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);
  return (
    <CwaProvider theme={theme}>
      <SiteShell route={route} toc={route.kind === "component" ? componentToc : []}>
        {route.kind === "home" ? (
          <HomePage />
        ) : route.kind === "components" ? (
          <ComponentsPage />
        ) : route.kind === "component" && route.id ? (
          <ComponentPage id={route.id} />
        ) : route.kind === "themes" ? (
          <ThemesPage route={route} />
        ) : route.kind === "patterns" || route.kind === "pattern" ? (
          <PatternsPage route={route} />
        ) : route.kind === "search" ? (
          <>
            <PageIntro route={route} />
            <SearchPage />
          </>
        ) : route.kind === "not-found" ? (
          <>
            <PageIntro route={route} />
            <a className="site-cta" href={href("/")}>
              返回首页 →
            </a>
            <p>
              <a className="text-link" href={href("/search/")}>
                搜索组件和文档
              </a>
            </p>
          </>
        ) : (
          <ArticlePage route={route} />
        )}
      </SiteShell>
    </CwaProvider>
  );
}
