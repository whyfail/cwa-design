import data from "virtual:cwa-site-data";
import { CodeBlock } from "../components/code-block";
import { Icon } from "../components/icons";
import { href, type SiteRoute } from "../routes";

const quickStart = `import { useState } from "react";\nimport { createRoot } from "react-dom/client";\nimport { Button, CwaProvider, Field, Input, Stack } from "@cwa-design/react";\nimport "@cwa-design/react/styles.css";\n\nfunction App() {\n  const [name, setName] = useState("");\n  const [saved, setSaved] = useState(false);\n  return (\n    <CwaProvider theme="system" material="auto" motion="system">\n      <form onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>\n        <Stack gap={4}>\n          <Field label="显示名称" description="用于工作区中的个人资料">\n            <Input value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} />\n          </Field>\n          <Button type="submit">保存设置</Button>\n          <p role="status">{saved ? "已保存：" + name : ""}</p>\n        </Stack>\n      </form>\n    </CwaProvider>\n  );\n}\n\nconst root = document.getElementById("root");\nif (root) createRoot(root).render(<App />);`;
export function PageIntro({ route, eyebrow }: { route: SiteRoute; eyebrow?: string }) {
  return (
    <>
      <p className="site-eyebrow">{eyebrow ?? route.kind.toUpperCase()}</p>
      <h1>{route.title}</h1>
      <p className="site-lead">{route.description}</p>
    </>
  );
}
const resourceCards = [
  {
    title: "组件契约",
    description: "30 个组件的真实属性、材质、无障碍约束与示例索引。",
    file: "manifest.json",
    icon: "code" as const,
  },
  {
    title: "设计 Token",
    description: "本版本的 primitive、semantic 与 motion Token 快照。",
    file: data.manifest.tokensFile,
    icon: "sliders" as const,
  },
];
export function ArticlePage({ route }: { route: SiteRoute }) {
  return (
    <>
      <PageIntro route={route} />
      {route.path === "/docs/getting-started/" ? (
        <>
          <div className="notice">
            <span className="alpha-label">Alpha 源码渠道</span>
            <p>
              当前页面是 <strong>{__CWA_RELEASE__.version}</strong> 的源码候选。该版本尚未发布到
              npm，请使用提供的源码 workspace。公开 GitHub
              仓库可读，但本地候选可能包含尚未推送的修改。
            </p>
          </div>
          <section id="install">
            <h2>1. 构建现有 workspace</h2>
            <p>
              在 CWA Design 源码根目录执行。沿用项目的 Node LTS 与 packageManager
              字段，不需要重新创建工程。
            </p>
            <CodeBlock
              label="Shell"
              code={`corepack pnpm install --frozen-lockfile\ncorepack pnpm --filter @cwa-design/tokens run build\ncorepack pnpm --filter @cwa-design/react run build\ncorepack pnpm --filter @cwa-design/examples-react-vite run build`}
            />
            <p>
              <a className="text-link" href="https://github.com/whyfail/cwa-design">
                查看真实源码仓库 ↗
              </a>
            </p>
            <p className="doc-note">
              仓库内已有 <code>examples/react-vite</code> 消费工程，可用来检查入口、CSS 和构建。
            </p>
          </section>
          <section id="workspace">
            <h2>2. 使用 workspace 依赖</h2>
            <p>
              对于同一 pnpm workspace 内的 React 应用，声明组件库依赖并保留 React 19 的实际版本。
            </p>
            <CodeBlock
              label="package.json"
              code={JSON.stringify(
                {
                  dependencies: {
                    "@cwa-design/react": "workspace:*",
                    react: "19.3.0",
                    "react-dom": "19.3.0",
                  },
                },
                null,
                2,
              )}
            />
            <p>独立工程可使用本地打包并验证的 tarball。下载后在已有 React 19 工程中安装文件。</p>
          </section>
          <section id="first-page">
            <a
              className="text-link"
              href={href(`/downloads/cwa-design-react-${data.manifest.libraryVersion}.tgz`)}
              download
            >
              下载 React 组件包 {data.manifest.libraryVersion} ↓
            </a>
            <CodeBlock
              label="Shell · 独立工程"
              code={`corepack pnpm add ./cwa-design-react-${data.manifest.libraryVersion}.tgz`}
            />
            <h2>3. 写一个可交互页面</h2>
            <p>样式入口引入一次，Provider 负责主题与偏好，业务持有表单状态。</p>
            <CodeBlock code={quickStart} />
          </section>
          <section id="next">
            <h2>下一步</h2>
            <div className="link-card-grid">
              <a href={href("/components/")}>
                <strong>选择组件</strong>
                <p>查找 30 个组件与同源示例。</p>
                <Icon name="arrow" />
              </a>
              <a href={href("/themes/")}>
                <strong>调整主题</strong>
                <p>比较材质并导出配置。</p>
                <Icon name="arrow" />
              </a>
              <a href={href("/ai/")}>
                <strong>接入 AI 开发工具</strong>
                <p>Skill 与 MCP 按真实契约工作。</p>
                <Icon name="arrow" />
              </a>
            </div>
          </section>
        </>
      ) : route.path === "/docs/theming/" ? (
        <>
          <section id="provider">
            <h2>Provider 先表达偏好</h2>
            <p>
              主题、材质、密度和动效是独立配置。<code>system</code> 跟随操作系统；
              <code>material="solid"</code> 明确请求实色降级。
            </p>
            <CodeBlock
              code={`<CwaProvider\n  theme="system"\n  material="auto"\n  motion="system"\n  density="comfortable"\n  locale="zh-CN"\n>\n  <App />\n</CwaProvider>`}
            />
            <div className="site-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>配置</th>
                    <th>有效值</th>
                    <th>默认</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>theme</td>
                    <td>light / dark / system</td>
                    <td>system</td>
                  </tr>
                  <tr>
                    <td>material</td>
                    <td>auto / solid</td>
                    <td>auto</td>
                  </tr>
                  <tr>
                    <td>motion</td>
                    <td>system / reduced / full</td>
                    <td>system</td>
                  </tr>
                  <tr>
                    <td>density</td>
                    <td>comfortable / compact</td>
                    <td>comfortable</td>
                  </tr>
                  <tr>
                    <td>locale</td>
                    <td>语言标识字符串</td>
                    <td>zh-CN</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="doc-note">
              具体组件的语义、键盘行为和数值文字仍由组件 API 与业务共同负责。
            </p>
          </section>
          <section id="tokens">
            <h2>用公开 Token 定制</h2>
            <p>
              组件库通过 CSS 自定义属性暴露设计变量。把覆盖限定在应用主题类中，不改组件私有选择器。
            </p>
            <CodeBlock
              label="CSS"
              code={`.my-cwa-theme {\n  --cwa-design-color-accent: #4c55d4;\n  --cwa-design-color-on-accent: #ffffff;\n  --cwa-design-radius-control: 0.875rem;\n  --cwa-design-radius-panel: 1.5rem;\n}\n/* <CwaProvider className="my-cwa-theme"> */`}
            />
            <a className="text-link" href={href("/themes/")}>
              在主题实验室生成配置 →
            </a>
          </section>
          <section id="scope">
            <h2>主题与 Portal</h2>
            <p>
              Provider 的主题属性会随浮层作用域传递。自定义 Portal 容器可用{" "}
              <code>portalContainer</code>；品牌 Token 覆盖需要在实际 Portal 位置保持可继承作用域。
            </p>
            <p>
              网站主题覆盖 html、body、Shell
              与示例。组件详情允许单独切换示例的浅深主题，不改变正文阅读模式。
            </p>
          </section>
          <section id="preferences">
            <h2>尊重系统偏好</h2>
            <p>
              减少动态、减少透明、高对比度与 forced colors
              需要在最终应用里保留。不要删除可见焦点或强制所有场景使用 Clear 玻璃。
            </p>
            <a className="text-link" href={href("/design/accessibility/")}>
              阅读无障碍指南 →
            </a>
          </section>
        </>
      ) : route.path === "/docs/compatibility/" ? (
        <>
          <section id="react">
            <h2>React 首发</h2>
            <p>
              本版本只提供 React 包，peer 范围为 React / React DOM 19。没有 Vue、Nuxt
              或移动原生适配包，不能直接复用 Web 材质渲染为 Apple 原生 Liquid Glass。
            </p>
            <p>
              采用 ESM 与独立 CSS 入口。组件包与官网沿用现有锁文件，Vite、Base UI 和 Motion
              工具链没有在本轮整体升级。
            </p>
          </section>
          <section id="ssr">
            <h2>静态正文与客户端交互</h2>
            <p>
              官网在构建时生成每条路由的 HTML，使用一致的 React renderToString /
              hydrateRoot。可索引的说明、API 与源码不依赖所有示例加载。
            </p>
            <p>
              重型示例在接近视口时作为客户端 island 加载；Portal
              与浏览器交互只在浏览器执行。应用使用 SSR 时需要保持首帧主题、初始状态和 ID 一致。
            </p>
          </section>
          <section id="browser">
            <h2>现代浏览器与材质降级</h2>
            <p>
              不支持 backdrop-filter 或请求减少透明时，材质应回退到稳定背景。系统高对比度和 forced
              colors 保留边界与状态。
            </p>
            <p>
              自动 Chromium、Firefox 与 Playwright WebKit 的结果只覆盖对应自动化引擎；真实
              Safari/iOS、人工读屏和实际背景对比度仍需在业务场景中验证。
            </p>
          </section>
          <section id="alpha">
            <h2>Alpha 边界</h2>
            <p>
              Sheet 当前为单展开位与拖动关闭；Slider 示例为单值。三套 recipes 是本地组件组合，AI
              工作台使用静态 fixture，没有模型密钥、消息后端或真实文件上传。
            </p>
            <a className="text-link" href={href("/changelog/")}>
              查看当前版本说明 →
            </a>
          </section>
        </>
      ) : route.kind === "design" ? (
        <DesignContent path={route.path} />
      ) : route.kind === "ai" ? (
        <AiContent path={route.path} />
      ) : route.kind === "resources" ? (
        <>
          <section id="downloads">
            <h2>本版本下载</h2>
            <p>
              所有文件来自同版本构建产物，链接在官网构建时核对。当前版本{" "}
              <code>{data.manifest.libraryVersion}</code>。
            </p>
            <div className="link-card-grid">
              {resourceCards.map((resource) => (
                <a
                  key={resource.file}
                  href={href(
                    `/downloads/registry/${data.manifest.libraryVersion}/${resource.file}`,
                  )}
                  download
                >
                  <Icon name={resource.icon} />
                  <strong>{resource.title}</strong>
                  <p>{resource.description}</p>
                  <span>下载 JSON ↓</span>
                </a>
              ))}
              <a
                href={href(`/downloads/cwa-design-skill-${data.manifest.libraryVersion}.tar.gz`)}
                download
              >
                <Icon name="spark" />
                <strong>CWA Design Skill</strong>
                <p>SKILL.md、设计规则与组件契约，打包后可离线阅读。</p>
                <span>下载 Skill ↓</span>
              </a>
            </div>
          </section>
          <section id="machine">
            <h2>可读与机器可读</h2>
            <div className="resource-list">
              <a href={href("/llms.txt")}>
                llms.txt <span>AI 资料入口 ↗</span>
              </a>
              <a href={href("/search-index.json")}>
                搜索索引 <span>标题、中文别名与关键词 ↗</span>
              </a>
              <a href={href("/routes.json")}>
                路由清单 <span>真实静态页面 ↗</span>
              </a>
              <a href={href("/release.json")}>
                构建记录 <span>版本、源码基线与工作区状态 ↗</span>
              </a>
              <a href={href("/sitemap.xml")}>
                站点地图 <span>公开路由 ↗</span>
              </a>
            </div>
          </section>
          <section id="community">
            <h2>源码与交互工作台</h2>
            <div className="link-card-grid">
              <a href="https://github.com/whyfail/cwa-design">
                <Icon name="github" />
                <strong>GitHub</strong>
                <p>查看源码、问题与实际提交。</p>
                <span>打开仓库 ↗</span>
              </a>
              <a href={href("/storybook/")}>
                <Icon name="layers" />
                <strong>Storybook</strong>
                <p>工程组件状态与交互测试。官网提供上手、设计和使用流程。</p>
                <span>打开工作台 ↗</span>
              </a>
            </div>
          </section>
        </>
      ) : route.kind === "changelog" ? (
        <>
          <section id="candidate">
            <h2>
              {__CWA_RELEASE__.version}
              <span className="alpha-label">当前源码候选</span>
            </h2>
            <p>
              本地构建，尚未发布 npm。源码基线为 <code>{__CWA_RELEASE__.commit}</code>
              {__CWA_RELEASE__.dirty ? "，含本轮尚未提交的工作区修改。" : "。"}这不是线上部署 commit
              的声明。
            </p>
            <ul>
              <li>共享玻璃光学层：背景透射、边缘光、反射、内壁与独立投影。</li>
              <li>主题与偏好基础：focus、motion、深色页面与减少透明回退。</li>
              <li>正式官网：真实静态路由、30 个组件详情、同源示例、搜索与主题实验室。</li>
              <li>AI 资料：补全 API 与源码，按确切版本读取 Registry、Skill 与本地 MCP。</li>
            </ul>
            <a href={href("/release.json")} className="text-link">
              读取构建记录 →
            </a>
          </section>
          <section id="deployed">
            <h2>
              0.1.0-alpha.0<span className="muted-label">此前部署</span>
            </h2>
            <p>
              先前上线的是四个页签的简版文档与 Storybook。历史 Registry
              被保留；当前站点不提供一套不存在的旧版官网路由。
            </p>
            <p>当前候选是否已部署，应以实际线上 release.json 和 GitHub Pages 运行记录为准。</p>
          </section>
        </>
      ) : null}
    </>
  );
}
function DesignContent({ path }: { path: string }) {
  return path === "/design/" ? (
    <>
      <section id="principles">
        <h2>轻盈来自清晰的层次</h2>
        <p>
          玻璃承担浮动功能层，让背景仍可感知；稳定的内容表面承担长时间阅读。空间、文字和反馈共同表达界面秩序。
        </p>
        <div className="principle-grid">
          <div>
            <span>01</span>
            <h3>清楚的目的</h3>
            <p>让重要动作被看见，一处只强调一个主操作。</p>
          </div>
          <div>
            <span>02</span>
            <h3>准确的空间</h3>
            <p>用材质与留白区分内容、导航和临时任务。</p>
          </div>
          <div>
            <span>03</span>
            <h3>及时的响应</h3>
            <p>按下立即反馈，动画可以被新操作打断。</p>
          </div>
          <div>
            <span>04</span>
            <h3>人的控制权</h3>
            <p>尊重键盘、减少动态与减少透明等偏好。</p>
          </div>
        </div>
      </section>
      <section id="language">
        <h2>从设计规则到真实组件</h2>
        <div className="link-card-grid">
          <a href={href("/design/materials/")}>
            <strong>材质与层次</strong>
            <p>在真实背景上选择玻璃的厚度。</p>
            <Icon name="arrow" />
          </a>
          <a href={href("/design/motion/")}>
            <strong>响应与动效</strong>
            <p>保持动作连续与空间可预测。</p>
            <Icon name="arrow" />
          </a>
          <a href={href("/design/accessibility/")}>
            <strong>无障碍设计</strong>
            <p>让功能在不同能力与偏好下成立。</p>
            <Icon name="arrow" />
          </a>
        </div>
      </section>
    </>
  ) : path === "/design/materials/" ? (
    <>
      <section id="hierarchy">
        <h2>四种真实表面</h2>
        <div className="site-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Surface.material</th>
                <th>用途</th>
                <th>选择依据</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>solid</td>
                <td>正文、表格、表单与降级</td>
                <td>稳定背景，优先长时间阅读</td>
              </tr>
              <tr>
                <td>frosted</td>
                <td>较厚的内容与结构区域</td>
                <td>保留层次，降低背景干扰</td>
              </tr>
              <tr>
                <td>glass</td>
                <td>独立导航、工具栏与浮动控件</td>
                <td>透射、边缘光与投影共同分离层次</td>
              </tr>
              <tr>
                <td>glass-clear</td>
                <td>媒体背景上的控件，显式启用</td>
                <td>验证实际图像背景与局部 dimming</td>
              </tr>
            </tbody>
          </table>
        </div>
        <CodeBlock
          code={`<Surface material="glass">\n  <Button variant="ghost">播放</Button>\n</Surface>`}
        />
      </section>
      <section id="overlap">
        <h2>控制采样层数</h2>
        <p>
          同一个玻璃工具栏内的按钮共享外壳，用状态填充表达操作。独立浮层可以采用玻璃；覆盖另一块玻璃区域时，根据实际重叠关系加厚或转实色。
        </p>
        <p>
          Portal 只改变 DOM 与定位，不会消除视觉重叠。不能把“避免玻璃叠玻璃”解释为所有菜单永远实色。
        </p>
      </section>
      <section id="optics">
        <h2>透射、边缘与内壁</h2>
        <p>
          共享材料规则提供固定背景采样、定向反射、非均匀
          rim、内高光与接触/环境投影。文字和图标保持不透明，不用容器整体 opacity 做玻璃。
        </p>
        <p>
          Regular 默认填充遮蔽为浅色 52%（白色底）、深色 68%（中性石墨底）。Clear
          在透明填充之外另有局部遮蔽层（浅色白色 16%、深色黑色 40%，与填充合成约 33%／52%），
          用于媒体控件的可读性；最终透射不能只看填充的
          alpha。实验室调整后的主题仍需在应用的实际背景上检查。
        </p>
        <p>
          Web CSS 是材质近似；局部折射不是当前默认跨浏览器能力，也不宣称与 Apple 原生 Liquid Glass
          等价。
        </p>
        <a className="text-link" href={href("/themes/")}>
          用真实组件比较材质 →
        </a>
      </section>
      <section id="background-readability">
        <h2>背景可读性策略</h2>
        <p>
          以 2 主题 × 9 背景 × 4 材质的实测矩阵（逐文字包围框采样，阈值 4.5:1）为准：
          <strong>正文与控件标签</strong>（不透明正文色）在 regular 下全部验证背景达标；
          <strong>副文字</strong>（<code>--cwa-design-color-glass-text-muted</code>）在 regular
          下仅保证中等亮度背景（山水、文字列表、图表、棋盘）与同向极端背景（浅色×纯白、深色×纯黑）。
        </p>
        <p>
          跨亮度媒体（浅色主题×暗照片、深色主题×亮照片）、明暗分区与反向极端背景是已知的压力负例：
          请改用 frosted 或 solid（两者在全部验证背景达标），或给控件局部实色底面。
          媒体前景策略看媒体本身的亮暗，而不是系统主题——系统深色也会遇到亮照片。
        </p>
        <p>
          clear 只用于媒体上的轻量工具栏：浅色配亮调媒体、深色配暗调媒体，只放少量大号短标签；
          表单与长文禁用。压力组合不能通过换有利底图或删样本来隐藏。
        </p>
      </section>
      <section id="fallback">
        <h2>回退也是设计的一部分</h2>
        <p>
          减少透明、缺少 backdrop-filter、高对比度和显式 solid
          都需要稳定的替代背景。使用照片、高频棋盘与明暗分区验证可读性，不能只看纯白背景。
        </p>
      </section>
    </>
  ) : path === "/design/motion/" ? (
    <>
      <section id="response">
        <h2>先回应，再完成动作</h2>
        <p>
          按钮在 pointer-down 给出按下反馈，原生 click、Enter 和 Space
          提交动作。手势过程中持续追踪，不等待动画完成才处理输入。
        </p>
      </section>
      <section id="continuity">
        <h2>可中断的连续运动</h2>
        <p>
          运动从当前可见位置开始，手势释放延续速度。Sheet
          的拖动、关闭与复位要保持相同空间方向；新输入可以重抓并改变目标。
        </p>
        <p>
          组件内部保留 Base UI 的焦点与键盘协议，Motion
          负责手势与弹簧。业务不要在动画期间加一层全局输入锁。
        </p>
      </section>
      <section id="restraint">
        <h2>克制的反馈</h2>
        <p>
          默认快速收敛，只有带动量的操作才需要少量回弹。材料 blur 保持固定，动画主要改变 transform
          与 opacity。不要添加全屏持续移动背景。
        </p>
      </section>
      <section id="reduced">
        <h2>减少动态</h2>
        <p>
          系统请求减少动态时保留静态或轻微反馈。CwaProvider 的 motion
          配置与实际系统偏好共同决定行为，界面仍需清楚表达当前状态。
        </p>
        <a className="text-link" href={href("/components/sheet/")}>
          操作 Sheet 示例 →
        </a>
      </section>
    </>
  ) : (
    <>
      <section id="names">
        <h2>名称、结构与状态</h2>
        <p>
          无文字图标按钮必须有 label。表单用 Field
          关联标签、说明与错误；页面保留正确标题层级。成功、错误和选中状态同时用文字或结构表达。
        </p>
      </section>
      <section id="keyboard">
        <h2>完整的键盘路径</h2>
        <p>
          Tab 能抵达可操作目标，Enter / Space 激活。菜单、Select、Tabs 和 RadioGroup
          保留组件内建方向键语义；模态任务需要 Escape 与关闭后的焦点返回。
        </p>
        <p>Tooltip 仅补充信息，关键说明不能只在 hover 出现。拖动必须保留键盘替代。</p>
      </section>
      <section id="contrast">
        <h2>在合成背景上验证</h2>
        <p>
          普通文本以 4.5:1、符合定义的大文本以 3:1
          为目标，必要的交互边界按非文本对比检查。透明表面需测真实合成结果。
        </p>
        <p>默认 44px 点击目标与清晰焦点是产品规则；不能将它们混称为 WCAG AA 的所有条件。</p>
        <a className="text-link" href="https://www.w3.org/TR/WCAG22/">
          WCAG 2.2 官方规范 ↗
        </a>
      </section>
      <section id="preferences">
        <h2>保留人的偏好</h2>
        <p>
          减少动态、减少透明、高对比度和 forced colors
          均需保持有效。自动检查通过不能替代人工读屏与真实 Safari/iOS 使用验证。
        </p>
      </section>
    </>
  );
}
function AiContent({ path }: { path: string }) {
  return path === "/ai/skill/" ? (
    <>
      <section id="download">
        <h2>下载同版本 Skill</h2>
        <p>
          Skill 是离线可读的设计规则与组件契约。先确认应用已安装框架与版本，再查询相同版本的 API。
        </p>
        <a
          className="download-button"
          href={href(`/downloads/cwa-design-skill-${data.manifest.libraryVersion}.tar.gz`)}
          download
        >
          下载 Skill {data.manifest.libraryVersion} ↓
        </a>
        <p className="doc-note">
          解压后将 cwa-design 目录放入支持 Agent Skills
          的宿主技能目录。不同宿主的安装位置以其实际配置为准。
        </p>
      </section>
      <section id="workflow">
        <h2>让模型按真实 API 工作</h2>
        <ol>
          <li>读取应用 package.json 和锁文件，确认 React 与 CWA Design 版本。</li>
          <li>先读 overview 与设计规则，按任务选择已存在组件。</li>
          <li>查组件契约与同源示例，保留材质、label 和键盘约束。</li>
          <li>生成可审查补丁，运行类型、构建与对应行为检查。</li>
        </ol>
        <CodeBlock
          label="给 AI 的指令"
          code={`使用 CWA Design ${data.manifest.libraryVersion} 的 React 组件。\n先读取已安装版本与本版本 Registry/Skill。\n我要一个浅色设置面板，使用真实 Field、Input、Switch、Button。\n正文保持稳定背景；浮动导航使用 Surface material="glass"。\n保留键盘与 reduced-motion/reduced-transparency，不能发明 import 或 props。`}
        />
      </section>
      <section id="source">
        <h2>SKILL.md</h2>
        <details>
          <summary>阅读实际技能文件</summary>
          <CodeBlock label="Markdown" code={data.skill} />
        </details>
      </section>
    </>
  ) : path === "/ai/mcp/" ? (
    <>
      <section id="local">
        <h2>本地 stdio 工具</h2>
        <p>
          MCP 运行在本机 Node 进程中，以只读工具返回真实契约、Token、示例与安装计划。GitHub Pages
          托管静态资料，不提供远程 /api/mcp 服务。
        </p>
        <CodeBlock
          label="Shell · 源码 workspace"
          code={`corepack pnpm --filter @cwa-design/registry run build\ncorepack pnpm run registry:build\ncorepack pnpm --filter @cwa-design/mcp run build\nnode packages/mcp/dist/index.js`}
        />
        <p className="doc-note">标准输入输出供 MCP 宿主使用，终端直接启动会等待协议消息。</p>
      </section>
      <section id="config">
        <h2>宿主配置示例</h2>
        <p>
          将下面路径替换为你的真实源码绝对路径，并按宿主 MCP
          设置添加。此格式说明启动方式，不代表所有宿主已验证。
        </p>
        <CodeBlock
          label="JSON"
          code={JSON.stringify(
            {
              mcpServers: {
                "cwa-design": {
                  command: "node",
                  args: ["/absolute/path/to/cwa-design/packages/mcp/dist/index.js"],
                },
              },
            },
            null,
            2,
          )}
        />
      </section>
      <section id="tools">
        <h2>按版本查询</h2>
        <p>
          先调用
          capabilities，读取可用框架与确切版本，再查询组件。缺少版本会明确报错，不会默默换成最新版。
        </p>
        <CodeBlock
          label="MCP tool input"
          code={JSON.stringify(
            {
              tool: "cwa_design_get_component",
              arguments: {
                framework: "react",
                version: data.manifest.libraryVersion,
                componentId: "surface",
                sections: ["api"],
                part: "root",
              },
            },
            null,
            2,
          )}
        />
        <div className="token-list">
          {[
            "cwa_design_get_capabilities",
            "cwa_design_search_components",
            "cwa_design_get_component",
            "cwa_design_get_example",
            "cwa_design_get_tokens",
            "cwa_design_get_recipe",
            "cwa_design_plan_installation",
            "cwa_design_get_migration",
          ].map((name) => (
            <code key={name}>{name}</code>
          ))}
        </div>
        <p>
          大型组件按 sections 与 part 查询，例如 SelectContent。示例、Token 与配方按 nextCursor
          继续读取；源码按 sourcePage.offset（Unicode 字符）拼接，并用 artifact.contentDigest
          校验完整文件。完整 MCP 响应上限 12 KiB，历史版本缺少产物会明确返回 REGISTRY_UNAVAILABLE。
        </p>
      </section>
      <section id="cli">
        <h2>没有 MCP 也能查询</h2>
        <CodeBlock
          label="Shell"
          code={`corepack pnpm --filter @cwa-design/cli run build\nnode packages/cli/dist/index.js inspect surface --version=${data.manifest.libraryVersion} --json\nnode packages/cli/dist/index.js plan button input --version=${data.manifest.libraryVersion} --json`}
        />
        <p>
          CLI 默认只输出可审查的计划，写入型命令需要显式请求。安装计划不会假定未发布 npm
          包已经可用。
        </p>
      </section>
    </>
  ) : (
    <>
      <section id="contract">
        <h2>一份契约，多个入口</h2>
        <p>
          人类开发者查看网页与源码，AI 助手读取 Skill、Registry、CLI 或
          MCP。它们共享同版本元数据、真实示例和 SHA-256 摘要。
        </p>
        <div className="link-card-grid">
          <a href={href("/ai/skill/")}>
            <Icon name="spark" />
            <strong>Skill</strong>
            <p>可离线阅读的设计规范与组件契约。</p>
            <span>查看技能 →</span>
          </a>
          <a href={href("/ai/mcp/")}>
            <Icon name="code" />
            <strong>MCP 与 CLI</strong>
            <p>查询版本、组件、示例与安装计划。</p>
            <span>接入工具 →</span>
          </a>
          <a href={href("/resources/")}>
            <Icon name="layers" />
            <strong>静态资料</strong>
            <p>Registry、Token、Markdown 与 llms.txt。</p>
            <span>下载资源 →</span>
          </a>
        </div>
      </section>
      <section id="version">
        <h2>版本先于生成</h2>
        <p>
          当前契约版本 <code>{data.manifest.libraryVersion}</code>，Schema{" "}
          <code>{data.manifest.schemaVersion}</code>。查找组件前先确认本地实际安装版本，不能混用新
          API。
        </p>
        <CodeBlock label="Registry digest" code={data.manifest.registryDigest} />
      </section>
      <section id="boundaries">
        <h2>让生成结果可审查</h2>
        <p>
          工具只读，生成步骤保留源码与编译结果。AI
          不得发明组件、不替换原生语义，也不宣称候选包已发布。缺少资料时修复源契约，再重新生成网站与
          Skill。
        </p>
        <a className="text-link" href={href("/llms.txt")}>
          打开 llms.txt →
        </a>
      </section>
    </>
  );
}
