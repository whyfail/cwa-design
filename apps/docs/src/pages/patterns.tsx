import data from "virtual:cwa-site-data";
import { type ComponentType, useEffect, useState } from "react";
import { CodeBlock } from "../components/code-block";
import { href, type SiteRoute } from "../routes";
import { PageIntro } from "./articles";

export function PatternsPage({ route }: { route: SiteRoute }) {
  const [status, setStatus] = useState("");
  const [Preview, setPreview] = useState<ComponentType<{
    id: string;
    onStatus: (message: string) => void;
  }> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("../components/pattern-preview").then(
      (module) => {
        if (!cancelled) setPreview(() => module.default);
      },
      () => setStatus("组合加载失败，请刷新或反馈源码仓库"),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  const recipes = route.id
    ? data.manifest.recipes.filter((recipe) => recipe.id === route.id)
    : data.manifest.recipes;
  return (
    <>
      <PageIntro route={route} />
      <div className="notice">
        <p>
          这些组合由真实组件实现，演示状态保存在当前页面。设置与账户示例不连接业务后端，AI
          工作台使用静态消息 fixture。
        </p>
      </div>
      {recipes.map((recipe) => (
        <section className="pattern-section" key={recipe.id}>
          <h2>{recipe.title}</h2>
          <div className="pattern-stage">
            {Preview ? (
              <Preview id={recipe.id} onStatus={setStatus} />
            ) : (
              <p role="status">正在准备交互组合…</p>
            )}
          </div>
          <p role="status">{status}</p>
          <h3>组合使用的组件</h3>
          <div className="pattern-component-links">
            {recipe.components.map((id) => (
              <a key={id} href={href(`/components/${id}/`)}>
                {id}
              </a>
            ))}
          </div>
          {(recipe.limitations ?? []).map((item) => (
            <p className="doc-note" key={item}>
              {item}
            </p>
          ))}
          <details>
            <summary>查看组合源码</summary>
            {recipe.files.map((file) =>
              data.sources[file] ? (
                <CodeBlock key={file} label={file} code={data.sources[file]} />
              ) : (
                <p key={file}>源文件：{file}</p>
              ),
            )}
          </details>
          {!route.id ? (
            <a className="text-link" href={href(`/patterns/${recipe.id}/`)}>
              单独查看此组合 →
            </a>
          ) : null}
        </section>
      ))}
    </>
  );
}
