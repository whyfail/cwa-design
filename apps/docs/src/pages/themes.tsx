import { type SurfaceMaterial, useCwaContext } from "@cwa-design/react";
import { useState } from "react";
import { SAFE_ALTERNATIVE_HINT, supportState } from "../background-policy";
import { CodeBlock } from "../components/code-block";
import { GlassPlayground } from "../components/glass-playground";
import { type SiteRoute } from "../routes";
import {
  buildThemeOverrides,
  providerClassNameAttribute,
  renderCssSnippet,
  THEME_GLASS_TINT,
} from "../theme-overrides";
import { PageIntro } from "./articles";

// 显式品牌主色选项；空值表示继承当前主题 Token（预览、代码与导出同规则）。
const ACCENT_PRESETS = [
  { value: "#005fbe", label: "Apple Blue" },
  { value: "#6355cb", label: "Iris" },
  { value: "#087a6a", label: "Jade" },
];

const BACKGROUNDS = [
  { value: "landscape", label: "山水与光（自绘）" },
  { value: "photo-light", label: "亮调插画（自绘）" },
  { value: "photo-dark", label: "暗调插画（自绘）" },
  { value: "photo-real-light", label: "真实亮照片" },
  { value: "photo-real-dark", label: "真实暗照片" },
  { value: "text-list", label: "文字列表" },
  { value: "chart", label: "彩色图表" },
  { value: "checker", label: "高频棋盘" },
  { value: "split", label: "明暗分区" },
  { value: "white", label: "纯白" },
  { value: "black", label: "纯黑" },
];

export function ThemesPage({ route }: { route: SiteRoute }) {
  const context = useCwaContext();
  const theme = context.resolvedTheme === "dark" || context.theme === "dark" ? "dark" : "light";
  const themeTint = THEME_GLASS_TINT[theme];
  const [material, setMaterial] = useState<SurfaceMaterial>("glass");
  const [background, setBackground] = useState("landscape");
  const [solid, setSolid] = useState(false);
  // null = 继承当前主题的公开 Token；拖动滑块后才成为显式覆盖。
  const [tint, setTint] = useState<number | null>(null);
  const [accent, setAccent] = useState("");
  const effectiveTint = tint ?? themeTint;
  // V04：支持状态四分类，感知显式 tint/accent（显式覆盖不继承默认矩阵结论）。
  const support = supportState({
    theme,
    material: solid ? "solid" : material,
    background,
    tint,
    accent,
  });
  // 唯一覆盖来源：预览变量、TSX/CSS 代码与 JSON 导出共用 buildThemeOverrides 结果。
  const overrides = buildThemeOverrides({ theme, tint, accent });
  const code = `<CwaProvider theme="${theme}" material="${solid ? "solid" : "auto"}"${providerClassNameAttribute(overrides.hasOverrides)}>\n  <Surface material="${material}">\n    {/* 你的控件 */}\n  </Surface>\n</CwaProvider>`;
  const css = renderCssSnippet(overrides);
  const config = {
    provider: { theme, material: solid ? "solid" : "auto" },
    surface: { material },
    cssTokens: overrides.cssTokens,
  };
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "cwa-design-theme.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageIntro route={route} />
      <div className="theme-controls">
        <label>
          材质
          <select
            value={material}
            onChange={(event) => setMaterial(event.target.value as SurfaceMaterial)}
          >
            <option value="glass">Regular Glass</option>
            <option value="frosted">Thick Frosted</option>
            <option value="glass-clear">Clear Glass</option>
            <option value="solid">Solid</option>
          </select>
        </label>
        <label>
          背景
          <select value={background} onChange={(event) => setBackground(event.target.value)}>
            {BACKGROUNDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          主色
          <select value={accent} onChange={(event) => setAccent(event.target.value)}>
            <option value="">跟随主题</option>
            {ACCENT_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="theme-range">
          Regular 遮蔽 {effectiveTint}%{tint === null ? "（主题默认）" : ""}
          <input
            type="range"
            min="20"
            max="90"
            value={effectiveTint}
            onChange={(event) => setTint(Number(event.target.value))}
          />
        </label>
        <label className="theme-solid">
          <input
            type="checkbox"
            checked={solid}
            onChange={(event) => setSolid(event.target.checked)}
          />
          显式实色降级
        </label>
        <button
          className="site-text-button"
          type="button"
          onClick={() => {
            setMaterial("glass");
            setBackground("landscape");
            setSolid(false);
            setTint(null);
            setAccent("");
          }}
        >
          重置
        </button>
      </div>
      <GlassPlayground
        material={material}
        background={background}
        solid={solid}
        {...(tint !== null && { tint })}
        {...(accent && { accent })}
      />
      {support.message ? (
        <p className="doc-note pressure-note" role="status" data-support-state={support.state}>
          <strong className="support-state-label">
            {support.state === "pressure"
              ? "压力"
              : support.state === "not-recommended"
                ? "不推荐此用途"
                : "显式覆盖未验证"}
            ：
          </strong>
          {support.message}
          {support.state !== "explicit-override-unverified" ? (
            <button
              type="button"
              className="site-text-button"
              onClick={() => setMaterial("frosted")}
            >
              改用 Thick Frosted
            </button>
          ) : null}
          {support.state !== "explicit-override-unverified" ? SAFE_ALTERNATIVE_HINT : null}
        </p>
      ) : null}
      <p className="doc-note">
        {material === "glass-clear"
          ? "Clear 适合照片、视频等媒体上的轻量工具栏；表单等需要稳定阅读底面的场景请用 Regular 或 Thick。"
          : "默认预览继承当前主题的公开 Token；拖动遮蔽滑块或选择品牌主色后才构成显式覆盖，代码与导出同步这一规则。"}
        {material === "glass-clear"
          ? " 导出与覆盖规则同上。"
          : " Thick、Clear 各有独立 Token。导出的是当前配置，背景仅用于验证。有覆盖时请在 TSX 中保留生成的 my-cwa-theme 类，CSS 才会生效。"}
      </p>
      <section id="export">
        <h2>带回你的应用</h2>
        <CodeBlock code={code} />
        <CodeBlock label="CSS · 当前主题" code={css} />
        <button className="download-button" type="button" onClick={download}>
          导出当前配置 JSON ↓
        </button>
        <p>
          品牌主色、玻璃遮蔽与真实背景共同影响对比度。导出后请在实际页面检查文字、焦点和控件边界。
        </p>
      </section>
    </>
  );
}
