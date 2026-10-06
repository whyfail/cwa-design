import {
  Button,
  CwaProvider,
  Popover,
  PopoverContent,
  Surface,
  Text,
  useCwaContext,
} from "@cwa-design/react";
import { useState } from "react";

/**
 * V06：玻璃候选同条件 A/B 对照（79168ce 旧 Token vs 0.1.0-alpha.3 候选）。
 * 同一真实照片、同一布局、同一文字，仅 Token 不同；A 作用域用内联 Token
 * 显式覆盖为旧值，B 使用当前默认（候选）。审美签收 pending，详见 ADR 0002。
 */

/** 旧（79168ce）光学 Token；仅覆盖与本候选有差异的项（深色填充实测后保持 68% 不变）。 */
const LEGACY_TOKENS: Record<string, string> = {
  "--cwa-design-color-glass-rim-top": "rgba(255,255,255,0.94)",
  "--cwa-design-color-glass-reflection": "rgba(255,255,255,0.30)",
  "--cwa-design-color-glass-contact-shadow": "rgba(24,46,82,0.10)",
  "--cwa-design-color-glass-ambient-shadow": "rgba(24,46,82,0.15)",
};

/** 深色主题的旧 rim 值与浅色不同，按主题拆分覆盖集合。 */
const LEGACY_TOKENS_DARK: Record<string, string> = {
  ...LEGACY_TOKENS,
  "--cwa-design-color-glass-rim-top": "rgba(255,255,255,0.38)",
};

const CANDIDATE_NOTES: Array<{ token: string; old: string; next: string; reason: string }> = [
  {
    token: "glass-rim-top（浅色）",
    old: "rgba(255,255,255,0.94)",
    next: "rgba(255,255,255,0.80)",
    reason: "顶部亮缘过强整圈读作白描边；方向性高光仍由渐变+内高光保留",
  },
  {
    token: "glass-rim-top（深色）",
    old: "rgba(255,255,255,0.38)",
    next: "rgba(255,255,255,0.28)",
    reason: "同上（深色）",
  },
  {
    token: "glass-reflection（浅色）",
    old: "rgba(255,255,255,0.30)",
    next: "rgba(255,255,255,0.22)",
    reason: "反射更轻，不盖正文",
  },
  {
    token: "glass-contact-shadow（浅色）",
    old: "rgba(24,46,82,0.10)",
    next: "rgba(24,46,82,0.14)",
    reason: "接触投影更实，与环境投影分工",
  },
  {
    token: "glass-ambient-shadow（浅色）",
    old: "rgba(24,46,82,0.15)",
    next: "rgba(24,46,82,0.20)",
    reason: "环境投影略深，浮起感由两层表达",
  },
];

/** 实测否决的候选：写入记录防止再次盲目尝试。 */
const REJECTED_CANDIDATES = [
  {
    token: "color-glass-regular-fill（深色）",
    tried: "rgba(28,29,34,0.68) → rgba(28,29,34,0.72)",
    result:
      "72% 填充实测 4.466:1；最终光学候选下实测最低 3.910:1——均 <4.5。不采纳填充加深；深色×纯白保持默认已测压力标注，安全替代为 Thick/Solid。",
  },
];

function ScrollTextStrip() {
  return (
    <div className="ab-scroll-strip" aria-hidden="true">
      <div className="ab-scroll-track">
        {Array.from({ length: 2 }, (_, copy) => (
          <span key={copy}>
            {Array.from({ length: 6 }, (_, index) => (
              <em key={index}>界面随内容而轻 · 文字保持不透明 · 背景持续流动采样 · </em>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function CandidatePane({
  label,
  legacy,
  media,
}: {
  label: string;
  legacy: boolean;
  media: "real-bright" | "real-dark";
}) {
  const context = useCwaContext();
  const theme = context.resolvedTheme === "dark" || context.theme === "dark" ? "dark" : "light";
  return (
    <CwaProvider
      theme={context.theme}
      motion={context.motion}
      density={context.density}
      className="ab-scope"
      style={legacy ? (theme === "dark" ? LEGACY_TOKENS_DARK : LEGACY_TOKENS) : {}}
    >
      <div className="ab-pane" data-ab-variant={legacy ? "legacy" : "candidate"}>
        <div className="ab-pane-head">
          <strong>{label}</strong>
          <Text variant="caption" tone="muted" as="span">
            {legacy ? "A · 79168ce Token" : "B · alpha.3 候选"}
          </Text>
        </div>
        <div className={`ab-media ab-media--${media}`}>
          <img
            src={`${import.meta.env.BASE_URL}media/photo-real-${media === "real-bright" ? "bright" : "dark"}.jpg`}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="sync"
          />
          <div className="ab-stacks">
            <Surface material="glass" className="ab-card">
              <strong>Regular 浮动层</strong>
              <Text variant="caption" tone="muted" as="p">
                副文字观察 rim 与透色
              </Text>
              <Popover defaultOpen>
                <Popover.Trigger
                  render={
                    <Button variant="secondary" size="sm">
                      打开浮层
                    </Button>
                  }
                />
                <PopoverContent>
                  <Popover.Title>{label} 浮层</Popover.Title>
                  <Popover.Description>浮层与面板使用同一份候选 Token。</Popover.Description>
                </PopoverContent>
              </Popover>
            </Surface>
            <div className="ab-duo">
              <Surface material="frosted" className="ab-card ab-card--small">
                <strong>Thick</strong>
              </Surface>
              <Surface material="glass-clear" className="ab-card ab-card--small">
                <strong>Clear</strong>
              </Surface>
            </div>
          </div>
        </div>
        <ScrollTextStrip />
        <Surface material="glass" className="ab-card ab-card--strip">
          <strong>滚动文字上的 Regular</strong>
        </Surface>
      </div>
    </CwaProvider>
  );
}

export function GlassCandidatesPage() {
  const [media, setMedia] = useState<"real-bright" | "real-dark">("real-bright");
  return (
    <>
      <p className="site-eyebrow">DESIGN</p>
      <h1>
        玻璃候选 A/B 对照<span className="alpha-label">待签收</span>
      </h1>
      <p className="site-lead">
        A = 已部署 79168ce 的 Token；B = 0.1.0-alpha.3 候选（默认已应用）。
        同一真实照片、同一布局、同一文字，仅 Token 不同；推荐 B 为默认候选， 审美签收 pending（ADR
        0002）。切换背景观察 rim、透色与投影在不同媒体上的表现。
      </p>
      <div className="ab-controls" role="group" aria-label="对照背景">
        <button
          type="button"
          aria-pressed={media === "real-bright"}
          onClick={() => setMedia("real-bright")}
        >
          真实亮照片
        </button>
        <button
          type="button"
          aria-pressed={media === "real-dark"}
          onClick={() => setMedia("real-dark")}
        >
          真实暗照片
        </button>
      </div>
      <div className="ab-grid">
        <CandidatePane label="对照 A" legacy media={media} />
        <CandidatePane label="候选 B" legacy={false} media={media} />
      </div>
      <section id="tokens">
        <h2>候选 Token 变更</h2>
        <div className="site-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>旧值（A）</th>
                <th>新值（B）</th>
                <th>原因</th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATE_NOTES.map((note) => (
                <tr key={note.token}>
                  <td>{note.token}</td>
                  <td>
                    <code>{note.old}</code>
                  </td>
                  <td>
                    <code>{note.next}</code>
                  </td>
                  <td>{note.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>实测否决的候选</h3>
        <div className="site-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>尝试</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              {REJECTED_CANDIDATES.map((note) => (
                <tr key={note.token}>
                  <td>{note.token}</td>
                  <td>
                    <code>{note.tried}</code>
                  </td>
                  <td>{note.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="doc-note">
          状态：implemented / verified（可读性矩阵在最终候选上重跑，受支持场景全部达标）； 视觉
          accepted = pending，由维护者签收。真实 Safari/iOS 与读屏为独立待办。
        </p>
      </section>
    </>
  );
}
