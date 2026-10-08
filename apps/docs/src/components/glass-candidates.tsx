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
import alpha2Tokens from "../../../../packages/registry/snapshots/react/0.1.0-alpha.2/tokens.json";
import currentTokens from "../../../../packages/tokens/src/tokens.json";

/**
 * F01：玻璃候选同条件 A/B 对照。A = 已部署 79168ce（alpha.2）Token，从冻结的
 * alpha.2 tokens.json 逐主题构造（不手写、不复制浅色集合）；B = 当前默认候选。
 * 同一真实照片、同一布局、同一文字、同一打开/焦点状态（默认关闭，交互对比）。
 * 审美签收 pending，详见 ADR 0002。
 */

const semanticOf = (table: unknown, theme: "light" | "dark"): Record<string, { value: string }> =>
  (table as { semantic: Record<"light" | "dark", Record<string, { value: string }>> }).semantic[
    theme
  ] ?? {};

/** 候选实际改动的光学 Token：A 值逐主题取自冻结 alpha.2，B 值取自当前默认。 */
const CHANGED_OPTICAL_TOKENS = [
  "glass-rim-top",
  "glass-reflection",
  "glass-contact-shadow",
  "glass-ambient-shadow",
] as const;

function legacyTokensFor(theme: "light" | "dark"): Record<string, string> {
  const frozen = semanticOf(alpha2Tokens, theme);
  const current = semanticOf(currentTokens, theme);
  const overrides: Record<string, string> = {};
  for (const token of CHANGED_OPTICAL_TOKENS) {
    const frozenValue = frozen[token]?.value;
    const currentValue = current[token]?.value;
    // 仅当候选确实修改了该 Token 时才注入旧值（A 与 B 的真实差异集）。
    if (frozenValue && currentValue && frozenValue !== currentValue) {
      overrides[`--cwa-design-color-${token}`] = frozenValue;
    }
  }
  return overrides;
}

const CANDIDATE_NOTES: Array<{ token: string; old: string; next: string }> = (
  ["light", "dark"] as const
)
  .flatMap((theme) =>
    CHANGED_OPTICAL_TOKENS.map((token) => ({
      token: `${token}（${theme === "light" ? "浅色" : "深色"}）`,
      old: semanticOf(alpha2Tokens, theme)[token]?.value ?? "（无）",
      next: semanticOf(currentTokens, theme)[token]?.value ?? "（无）",
    })),
  )
  .filter((note) => note.old !== note.next);

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
      style={legacy ? legacyTokensFor(theme) : {}}
    >
      <div className="ab-pane" data-ab-variant={legacy ? "legacy" : "candidate"}>
        <div className="ab-pane-head">
          <strong>{label}</strong>
          <Text variant="caption" tone="muted" as="span">
            {legacy ? "A · 79168ce Token" : "B · alpha.4 候选"}
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
          {/* F01：滚动文字层在玻璃层背后并穿过采样区域（reduced-motion 时静止）。 */}
          <div className="ab-scroll-layer" aria-hidden="true">
            <ScrollTextStrip />
          </div>
          <div className="ab-stacks">
            <Surface material="glass" className="ab-card">
              <strong>Regular 浮动层</strong>
              <Text variant="caption" tone="muted" as="p">
                副文字观察 rim 与透色
              </Text>
              <Popover>
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
      </div>
    </CwaProvider>
  );
}

export function GlassCandidatesPage() {
  const [media, setMedia] = useState<"real-bright" | "real-dark">("real-bright");
  return (
    <>
      {/* 页面 h1 与引言由 ArticlePage 的 PageIntro 提供；此处只放待签收标注与对照内容。 */}
      <p className="doc-note">
        <span className="alpha-label">待签收</span> A = 已部署 79168ce 的 Token（自冻结 alpha.2
        快照逐主题构造）；B = alpha.4 候选（默认已应用）。同一真实照片、同一布局、同一文字，仅 Token
        不同；推荐 B 为默认候选，审美签收 pending（ADR 0002）；打开状态由交互触发，A/B
        初始状态一致。
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
                  <td>
                    {note.token.includes("rim-top")
                      ? "顶部亮缘过强整圈读作白描边；方向性高光仍由渐变+内高光保留"
                      : note.token.includes("reflection")
                        ? "反射更轻，不盖正文"
                        : "接触/环境投影分工更清晰（浅色）"}
                  </td>
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
