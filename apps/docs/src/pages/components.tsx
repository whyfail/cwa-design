import data from "virtual:cwa-site-data";
import { useState } from "react";
import { CodeBlock } from "../components/code-block";
import { DemoCard } from "../components/demo-card";
import { Icon } from "../components/icons";
import { OverlayMaterialStage } from "../components/overlay-stage";
import { catalog, categories } from "../data/catalog";
import type { ComponentDoc, PropDoc } from "../data/types";
import { href } from "../routes";

/** 拥有浮层材质的组件在"材质与状态"一节使用共享的真实媒体对照舞台（N07）。 */
const OVERLAY_STAGE_IDS = new Set(["popover", "dropdown-menu", "select", "dialog", "sheet"]);

function ApiTable({ props }: { props: Record<string, PropDoc> }) {
  if (Object.keys(props).length === 0)
    return <p className="doc-note">没有新增 CWA 属性；完整继承属性见上方源类型声明。</p>;
  return (
    <div className="site-table-wrap">
      <table className="api-table">
        <thead>
          <tr>
            <th>属性</th>
            <th>说明</th>
            <th>类型</th>
            <th>默认值</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(props).map(([name, prop]) => (
            <tr key={name}>
              <td>
                <code>{name}</code>
                {prop.required ? <small className="api-required">必填</small> : null}
              </td>
              <td>{prop.description ?? prop.summary ?? "见类型定义"}</td>
              <td>
                <code>
                  {prop.type === "enum"
                    ? prop.values?.map((value) => JSON.stringify(value)).join(" | ")
                    : (prop.summary ?? prop.type)}
                </code>
              </td>
              <td>
                <code>
                  {prop.defaultSummary ??
                    (prop.default !== undefined ? JSON.stringify(prop.default) : "—")}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ComponentsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("全部");
  const filtered = data.manifest.components.filter(
    (component) =>
      (selected === "全部" || catalog[component.id]?.category === selected) &&
      `${component.name} ${catalog[component.id]?.zh} ${catalog[component.id]?.keywords.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <p className="site-eyebrow">COMPONENTS</p>
      <h1>
        组件总览<span className="page-count">{data.manifest.components.length}</span>
      </h1>
      <p className="site-lead">
        从基础操作到复杂浮层，按任务选择组件。每个组件都有真实 API、同源示例与设计约束。
      </p>
      <div className="component-filter">
        <label>
          <Icon name="search" size={17} />
          <input
            aria-label="筛选组件"
            placeholder="搜索名称或用途"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span>{filtered.length} 个组件</span>
      </div>
      <div className="category-tabs" aria-label="组件分类">
        {["全部", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={selected === category}
            onClick={() => setSelected(category)}
          >
            {category}
          </button>
        ))}
      </div>
      {categories.map((category) => {
        const group = filtered.filter((component) => catalog[component.id]?.category === category);
        return group.length ? (
          <section className="component-group" key={category}>
            <h2>
              {category}
              <span>{group.length}</span>
            </h2>
            <div className="component-grid">
              {group.map((component) => (
                <a
                  className="component-card"
                  href={href(`/components/${component.id}/`)}
                  key={component.id}
                >
                  <div
                    className={`component-glyph component-glyph--${component.id}`}
                    aria-hidden="true"
                  >
                    <span>{component.name.slice(0, 1)}</span>
                  </div>
                  <div>
                    <h3>
                      {component.name}
                      <small>{catalog[component.id]?.zh}</small>
                    </h3>
                    <p>{catalog[component.id]?.description}</p>
                  </div>
                  <Icon name="arrow" size={17} />
                </a>
              ))}
            </div>
          </section>
        ) : null;
      })}
      {filtered.length === 0 ? (
        <p className="empty-state">没有匹配的组件。试试“按钮”或“输入框”。</p>
      ) : null}
    </>
  );
}
const materialLabels: Record<string, string> = {
  "inherit-parent-surface": "继承父级表面",
  "glass-regular": "常规玻璃",
  "glass-thick": "较厚玻璃",
  "glass-clear-opt-in": "Clear 玻璃 · 显式启用",
  solid: "实色内容",
  frosted: "磨砂内容",
};
function TypeSource({
  component,
}: {
  component: { extends?: string[]; typeName?: string; sourceTypePath?: string };
}) {
  return (
    <p className="api-inheritance">
      类型：<code>{component.typeName ?? "以包内 TypeScript 声明为准"}</code>
      {component.extends?.length ? (
        <>
          {" "}
          · 继承 <code>{component.extends.join(", ")}</code>
        </>
      ) : null}
      {component.sourceTypePath ? (
        <>
          {" "}
          ·{" "}
          <a
            href={href(
              `/downloads/source/${component.sourceTypePath.split("#")[0]}${component.sourceTypePath.startsWith("@base-ui/") ? "/index.d.ts" : ""}`,
            )}
          >
            候选源类型 ↗
          </a>
        </>
      ) : null}
    </p>
  );
}
export function ComponentPage({ id }: { id: string }) {
  const component: ComponentDoc | undefined = data.manifest.components.find(
    (item) => item.id === id,
  );
  if (!component) throw new Error(`Component missing: ${id}`);
  const info = catalog[id];
  const examples = data.manifest.examples.filter((example) => example.componentId === id);
  const notes =
    typeof component.materialNotes === "string"
      ? [component.materialNotes]
      : (component.materialNotes ?? []);
  const related = data.manifest.components
    .filter((item) => item.id !== id && catalog[item.id]?.category === info?.category)
    .slice(0, 4);
  const tokenNames = data.tokens[id] ?? [];
  const story = data.storybook[id];
  return (
    <>
      <div className="page-breadcrumb">
        <a href={href("/components/")}>组件</a>
        <span>/</span>
        <span>{info?.category}</span>
      </div>
      <div className="component-page-heading">
        <div>
          <h1>
            {component.name}
            <span>{info?.zh}</span>
          </h1>
          <p className="site-lead">{component.description ?? info?.description}</p>
        </div>
        <span className="alpha-label">Alpha</span>
      </div>
      <p className="use-case">{info?.use}</p>
      <div className="component-quick-links">
        <a href="#examples">交互示例</a>
        <a href="#api">API</a>
        <a href={href(`/storybook/${story ? `?path=/story/${story}` : ""}`)}>Storybook ↗</a>
        <a href={href(`/downloads/registry/${data.manifest.libraryVersion}/manifest.json`)}>
          Registry ↗
        </a>
      </div>
      <section id="import">
        <h2>引入</h2>
        <CodeBlock
          code={`import { ${component.exports.join(", ")} } from "${component.importPath}";\nimport "${component.stylePath}"; // 应用入口引入一次`}
        />
        <p className="doc-note">
          当前通过源码 workspace 使用。
          <a href={href("/docs/getting-started/")}>查看有效安装步骤 →</a>
        </p>
      </section>
      <section id="examples">
        <h2>交互示例</h2>
        <p>可切换示例主题、开启实色降级并重置状态。应用根部需要 CwaProvider。</p>
        {examples.map((example) => (
          <DemoCard key={example.id} example={example} />
        ))}
      </section>
      <section id="api">
        <h2>API</h2>
        <p>下表读取本版本组件契约。原生与 Base UI 继承属性的完整定义保留在 TypeScript 声明中。</p>
        <TypeSource component={component} />
        <ApiTable props={component.props} />
        {Object.entries(component.compoundParts ?? {}).map(([part, contract]) => (
          <div className="compound-api" key={part}>
            <h3>{part}</h3>
            {contract.description ? <p>{contract.description}</p> : null}
            <TypeSource component={contract} />
            <ApiTable props={contract.props} />
          </div>
        ))}
      </section>
      <section id="material">
        <h2>材质与状态</h2>
        <div className="material-note">
          <Icon name="layers" />
          <div>
            <strong>{materialLabels[component.materialPolicy] ?? component.materialPolicy}</strong>
            <p>材质规则来自源 metadata。覆盖玻璃区域的浮层按实际重叠关系选择较厚或实色材质。</p>
          </div>
        </div>
        {notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
        {OVERLAY_STAGE_IDS.has(id) ? (
          <>
            <h3>媒体对照舞台</h3>
            <p>打开浮层，检查玻璃透色、边缘与阴影在真实亮/暗照片上的表现。</p>
            <OverlayMaterialStage id={id} />
          </>
        ) : null}
        <p>适用的状态与行为见示例及本页 API；系统减少透明与显式 solid 配置会启用回退。</p>
        <a className="text-link" href={href("/design/materials/")}>
          阅读材质指南 →
        </a>
      </section>
      <section id="tokens">
        <h2>关联 Token</h2>
        <p>以下变量从组件源样式的实际引用生成。共享光学规则还使用全局玻璃 Token。</p>
        {tokenNames.length ? (
          <div className="token-list">
            {tokenNames.map((token) => (
              <code key={token}>{token}</code>
            ))}
          </div>
        ) : (
          <p className="doc-note">
            此组件没有独立 CSS Token 引用；继承 Provider 与组合子组件的主题。
          </p>
        )}
        <a className="text-link" href={href("/themes/")}>
          在主题实验室调整公开 Token →
        </a>
      </section>
      <section id="accessibility">
        <h2>无障碍与使用约束</h2>
        <ul className="contract-list">
          {component.a11y.map((rule) => (
            <li key={rule}>
              <Icon name="check" size={16} />
              <code>{rule}</code>
            </li>
          ))}
        </ul>
        <p>这些是组件契约与使用要求。具体业务页面仍需验证标签、阅读顺序与实际背景下的对比度。</p>
        <a className="text-link" href={href("/design/accessibility/")}>
          查看无障碍使用指南 →
        </a>
      </section>
      <section id="related">
        <h2>相关组件</h2>
        <div className="related-grid">
          {related.map((item) => (
            <a href={href(`/components/${item.id}/`)} key={item.id}>
              {item.name}
              <span>{catalog[item.id]?.zh}</span>
              <Icon name="arrow" size={16} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
