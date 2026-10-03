import { CwaProvider, useCwaContext, type ThemePreference } from "@cwa-design/react";
import { Component, type ComponentType, type ReactNode, useEffect, useRef, useState } from "react";
import data from "virtual:cwa-site-data";
import type { ExampleDoc } from "../data/types";
import { CodeBlock } from "./code-block";
import { Icon } from "./icons";

const modules = {
  ...import.meta.glob("../../../../packages/react/src/**/examples/*.tsx"),
  ...import.meta.glob("../../../../packages/registry/examples/*.tsx"),
};
class DemoBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <p role="alert">示例运行失败，请查看控制台并反馈到源码仓库。</p>
    ) : (
      this.props.children
    );
  }
}
export function DemoCard({ example }: { example: ExampleDoc }) {
  const context = useCwaContext();
  const [Loaded, setLoaded] = useState<ComponentType | null>(null);
  const [error, setError] = useState("");
  const [reset, setReset] = useState(0);
  const [theme, setTheme] = useState<ThemePreference | "inherit">("inherit");
  const [solid, setSolid] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const entry = Object.entries(modules).find(([file]) =>
        file.endsWith(`/${example.sourcePath}`),
      );
      if (!entry) {
        setError("示例模块未进入构建产物");
        return;
      }
      void entry[1]()
        .then((module) => {
          const exported: unknown = (module as Record<string, unknown>)[example.exportName];
          if (typeof exported !== "function") throw new Error("示例导出与 manifest 不一致");
          if (!cancelled) setLoaded(() => exported as ComponentType);
        })
        .catch((reason: unknown) => {
          if (!cancelled) setError(reason instanceof Error ? reason.message : "示例加载失败");
        });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "300px" },
    );
    if (stage.current) observer.observe(stage.current);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [example.sourcePath, example.exportName]);
  const source = data.sources[example.file];
  if (!source) throw new Error(`Example source missing: ${example.id}`);
  return (
    <section className="demo-card" aria-labelledby={`example-${example.id}`}>
      <div className="demo-title">
        <div>
          <h3 id={`example-${example.id}`}>{example.title}</h3>
          <p>可运行示例 · 与复制源码同源</p>
        </div>
        <button
          type="button"
          className="site-text-button"
          onClick={() => setReset((value) => value + 1)}
        >
          重置
        </button>
      </div>
      <CwaProvider
        theme={theme === "inherit" ? context.theme : theme}
        material={solid ? "solid" : context.material}
        motion={context.motion}
        density={context.density}
      >
        <div className="demo-stage demo-stage--soft" ref={stage}>
          {error ? (
            <p role="alert">{error}</p>
          ) : Loaded ? (
            <DemoBoundary key={reset}>
              <Loaded />
            </DemoBoundary>
          ) : (
            <p className="demo-loading" role="status">
              正在准备交互示例…
            </p>
          )}
        </div>
      </CwaProvider>
      <div className="demo-tools">
        <span>
          <Icon name="code" size={15} />
          {example.id}
        </span>
        <label>
          <span className="site-sr-only">示例主题</span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemePreference | "inherit")}
          >
            <option value="inherit">跟随网站</option>
            <option value="light">浅色示例</option>
            <option value="dark">深色示例</option>
          </select>
        </label>
        <label className="demo-solid">
          <input
            type="checkbox"
            checked={solid}
            onChange={(event) => setSolid(event.target.checked)}
          />
          实色降级
        </label>
      </div>
      <details className="demo-source">
        <summary>查看与复制源码</summary>
        <CodeBlock code={source} />
        <p className="demo-source-note">
          在应用根部引入 styles.css 并配置 CwaProvider。源码 SHA-256：
          <code>{example.contentDigest.slice(7, 19)}</code>
        </p>
      </details>
    </section>
  );
}
