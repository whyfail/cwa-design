import { Surface } from "@cwa-design/react";
import { useState } from "react";
import data from "virtual:cwa-site-data";
import { CodeBlock } from "../components/code-block";
import { GlassPlayground } from "../components/glass-playground";
import { Icon } from "../components/icons";
import { categories, catalog } from "../data/catalog";
import { href } from "../routes";

export function HomePage() {
  const [solid, setSolid] = useState(false);
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <a className="hero-release" href={href("/changelog/")}>
            <span />
            React Alpha · {__CWA_RELEASE__.version}
            <Icon name="arrow" size={14} />
          </a>
          <h1>
            轻盈的玻璃。
            <br />
            <span>清晰的设计。</span>
          </h1>
          <p>
            让光与背景进入界面。
            <br />
            一套为现代 Web 与 AI 开发打造的 React 设计系统。
          </p>
          <div className="hero-actions">
            <a className="primary-link" href={href("/docs/getting-started/")}>
              开始使用
              <Icon name="arrow" size={17} />
            </a>
            <a className="secondary-link" href={href("/components/")}>
              探索组件
            </a>
          </div>
          <div className="hero-meta">
            <span>30 个 React 组件</span>
            <span>浅色 / 深色</span>
            <span>Skill + MCP</span>
          </div>
        </div>
        <div className="hero-visual">
          <GlassPlayground solid={solid} />
          <div className="hero-visual-caption">
            <span>真实组件，可直接操作</span>
            <label>
              <input
                type="checkbox"
                checked={solid}
                onChange={(event) => setSolid(event.target.checked)}
              />
              对比实色材质
            </label>
          </div>
        </div>
      </section>
      <section className="home-section home-material">
        <div className="section-heading">
          <p className="site-eyebrow">MATERIAL, WITH PURPOSE</p>
          <h2>玻璃，不止于模糊。</h2>
          <p>背景透射、定向边缘光、内壁高光与柔和投影，共同建立真实的空间层次。</p>
        </div>
        <div className="material-comparison">
          {(["solid", "glass", "frosted"] as const).map((material, index) => (
            <div className="material-sample" key={material}>
              <div className="material-sample-backdrop">
                <span className="sample-color sample-color--blue" />
                <span className="sample-color sample-color--pink" />
                <Surface material={material} className="sample-pane">
                  <Icon name={index === 0 ? "code" : index === 1 ? "spark" : "layers"} size={26} />
                  <strong>{["Solid", "Regular Glass", "Thick Frosted"][index]}</strong>
                  <span>{["稳定的内容表面", "轻盈的浮动功能层", "柔和的厚磨砂层"][index]}</span>
                </Surface>
              </div>
              <p>
                {
                  [
                    "让文字与内容安心落在清晰的背景上。",
                    "背景依然可感知，功能层轻盈而清楚。",
                    "增加遮蔽与厚度，让复杂背景退后一步。",
                  ][index]
                }
              </p>
            </div>
          ))}
        </div>
        <a className="text-link" href={href("/themes/")}>
          进入主题实验室，比较材质 →
        </a>
      </section>
      <section className="home-section">
        <div className="section-heading section-heading--row">
          <div>
            <p className="site-eyebrow">THE BUILDING BLOCKS</p>
            <h2>从一个按钮，到完整界面。</h2>
            <p>按任务组织的 30 个组件。真实属性、可操作示例与同源代码。</p>
          </div>
          <a className="text-link" href={href("/components/")}>
            查看全部组件 →
          </a>
        </div>
        <div className="home-category-grid">
          {categories.map((category, index) => (
            <a
              href={href(
                `/components/${data.manifest.components.find((item) => catalog[item.id]?.category === category)?.id ?? "button"}/`,
              )}
              key={category}
            >
              <span className="category-symbol" aria-hidden="true">
                {["⌘", "Aa", "≋", "◉", "↔", "◌"][index]}
              </span>
              <h3>{category}</h3>
              <p>
                {data.manifest.components
                  .filter((item) => catalog[item.id]?.category === category)
                  .map((item) => item.name)
                  .join(" · ")}
              </p>
              <Icon name="arrow" size={18} />
            </a>
          ))}
        </div>
      </section>
      <section className="home-section home-start">
        <div>
          <p className="site-eyebrow">A SMALL START</p>
          <h2>把设计带进你的代码。</h2>
          <p>
            统一主题与视觉偏好，保持熟悉的 React 使用方式。
            <br />
            从现有源码 workspace 开始，用真实 API 构建。
          </p>
          <a className="text-link" href={href("/docs/getting-started/")}>
            阅读上手指南 →
          </a>
        </div>
        <CodeBlock
          code={
            'import { CwaProvider, Surface, Button } from "@cwa-design/react";\nimport "@cwa-design/react/styles.css";\n\n<CwaProvider theme="system">\n  <Surface material="glass">\n    <Button onClick={save}>保存更改</Button>\n  </Surface>\n</CwaProvider>'
          }
        />
      </section>
      <section className="home-section home-design">
        <div className="section-heading">
          <p className="site-eyebrow">DESIGNED TO FEEL NATURAL</p>
          <h2>每一次操作，都有回应。</h2>
          <p>
            即时按下反馈、连续的弹簧运动、清晰的焦点。
            <br />
            设计规则落实到实际组件，也尊重人的偏好。
          </p>
        </div>
        <div className="principle-grid">
          <div>
            <span>01</span>
            <h3>自然的材质</h3>
            <p>同一功能板共用玻璃外壳，减少重复背景采样。</p>
          </div>
          <div>
            <span>02</span>
            <h3>连续的运动</h3>
            <p>可中断的反馈，让输入始终优先。</p>
          </div>
          <div>
            <span>03</span>
            <h3>清楚的语义</h3>
            <p>表单、焦点与键盘路径保留原生习惯。</p>
          </div>
          <div>
            <span>04</span>
            <h3>自由的偏好</h3>
            <p>深色、减少动态与减少透明均有对应设计。</p>
          </div>
        </div>
        <a className="text-link" href={href("/design/")}>
          了解设计语言 →
        </a>
      </section>
      <section className="home-section home-ai">
        <div>
          <span className="ai-orb" aria-hidden="true">
            <Icon name="spark" size={44} />
          </span>
          <p className="site-eyebrow">READY FOR YOUR AGENT</p>
          <h2>
            让 AI 理解设计，
            <br />
            也理解真实代码。
          </h2>
          <p>
            组件、文档、Skill 与 MCP 使用同一份版本化契约。
            <br />
            模型能查询真实属性、源码与材质规则，再生成你的界面。
          </p>
          <div className="hero-actions">
            <a className="primary-link" href={href("/ai/")}>
              接入 AI 开发
              <Icon name="arrow" size={17} />
            </a>
            <a className="secondary-link" href={href("/ai/skill/")}>
              获取 Skill
            </a>
          </div>
        </div>
        <div className="ai-contract">
          <div>
            <span className="code-dot" />
            CWA DESIGN · REGISTRY
          </div>
          <pre>
            <code>
              {JSON.stringify(
                {
                  version: data.manifest.libraryVersion,
                  component: "Surface",
                  props: { material: ["solid", "frosted", "glass", "glass-clear"] },
                  examples: "真实源码 + SHA-256",
                  tools: ["Skill", "CLI", "MCP"],
                },
                null,
                2,
              )}
            </code>
          </pre>
          <p>
            <Icon name="check" size={16} />
            同版本，可追溯，可离线读取
          </p>
        </div>
      </section>
      <section className="home-section">
        <div className="section-heading section-heading--row">
          <div>
            <p className="site-eyebrow">COMPOSE SOMETHING USEFUL</p>
            <h2>不止组件，还有组合方式。</h2>
            <p>从实际场景出发，查看完整的界面组合与源码。</p>
          </div>
          <a className="text-link" href={href("/patterns/")}>
            浏览组合 →
          </a>
        </div>
        <div className="home-pattern-grid">
          {data.manifest.recipes.map((recipe, index) => (
            <a key={recipe.id} href={href(`/patterns/${recipe.id}/`)}>
              <div className={`pattern-mini pattern-mini--${index}`} aria-hidden="true">
                <span />
                <span />
                <span />
                <i />
              </div>
              <h3>{recipe.title}</h3>
              <p>
                {
                  ["个人资料、通知与保存反馈", "账户信息与上下文操作", "消息、工具状态与详情面板"][
                    index
                  ]
                }
              </p>
              <Icon name="arrow" size={18} />
            </a>
          ))}
        </div>
      </section>
      <section className="home-section home-final">
        <p className="site-eyebrow">BUILD WITH CLARITY</p>
        <h2>
          你的下一个界面，
          <br />
          从这里开始。
        </h2>
        <div className="hero-actions">
          <a className="primary-link" href={href("/docs/getting-started/")}>
            开始使用
            <Icon name="arrow" size={17} />
          </a>
          <a className="secondary-link" href="https://github.com/whyfail/cwa-design">
            查看源码
            <Icon name="github" size={17} />
          </a>
        </div>
      </section>
    </>
  );
}
