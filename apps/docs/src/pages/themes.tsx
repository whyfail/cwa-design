import { type SurfaceMaterial, useCwaContext } from "@cwa-design/react";
import { useEffect, useState } from "react";
import { GlassPlayground } from "../components/glass-playground";
import { CodeBlock } from "../components/code-block";
import { PageIntro } from "./articles";
import { type SiteRoute } from "../routes";

export function ThemesPage({ route }: { route: SiteRoute }) {
  const context = useCwaContext();
  const theme = context.resolvedTheme === "dark" || context.theme === "dark" ? "dark" : "light";
  const rgb = theme === "dark" ? "24,31,45" : "255,255,255";
  const [material, setMaterial] = useState<SurfaceMaterial>("glass");
  const [background, setBackground] = useState("landscape");
  const [solid, setSolid] = useState(false);
  const [tint, setTint] = useState(52);
  useEffect(() => {
    setTint(theme === "dark" ? 70 : 52);
  }, [theme]);
  const [accent, setAccent] = useState("#005fbe");
  const code = `<CwaProvider theme="${theme}" material="${solid ? "solid" : "auto"}">\n  <Surface material="${material}">\n    {/* 你的控件 */}\n  </Surface>\n</CwaProvider>`;
  const css = `.my-cwa-theme {\n  --cwa-design-color-accent: ${accent};\n  --cwa-design-color-on-accent: #ffffff;\n  --cwa-design-color-glass-regular-fill: rgba(${rgb},${tint / 100});\n}`;
  const config = {
    provider: { theme, material: solid ? "solid" : "auto" },
    surface: { material },
    cssTokens: {
      "--cwa-design-color-accent": accent,
      "--cwa-design-color-on-accent": "#ffffff",
      "--cwa-design-color-glass-regular-fill": `rgba(${rgb},${tint / 100})`,
    },
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
            <option value="landscape">山水与光</option>
            <option value="checker">高频棋盘</option>
            <option value="split">明暗分区</option>
          </select>
        </label>
        <label>
          主色
          <select value={accent} onChange={(event) => setAccent(event.target.value)}>
            <option value="#005fbe">Apple Blue</option>
            <option value="#6355cb">Iris</option>
            <option value="#087a6a">Jade</option>
          </select>
        </label>
        <label className="theme-range">
          Regular 遮蔽 {tint}%
          <input
            type="range"
            min="20"
            max="90"
            value={tint}
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
            setTint(theme === "dark" ? 70 : 52);
            setAccent("#005fbe");
          }}
        >
          重置
        </button>
      </div>
      <GlassPlayground
        material={material}
        background={background}
        solid={solid}
        tint={tint}
        accent={accent}
      />
      <p className="doc-note">
        遮蔽滑块覆盖 Regular 的公开 Token；Thick、Clear 各有独立
        Token。导出的是当前配置，背景仅用于验证。导出采用当前网站的浅深主题与对应色值；跟随系统的正式主题请分别配置两套值。
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
