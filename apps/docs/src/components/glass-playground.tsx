import {
  Button,
  CwaProvider,
  Field,
  Input,
  Popover,
  PopoverContent,
  SegmentedControl,
  Slider,
  Surface,
  type SurfaceMaterial,
  Switch,
  useCwaContext,
} from "@cwa-design/react";
import { useState } from "react";
import { buildThemeOverrides } from "../theme-overrides";
import { Icon } from "./icons";

export function Landscape() {
  return (
    <svg
      className="landscape"
      viewBox="0 0 1100 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cwa-sky" x2="0" y2="1">
          <stop stopColor="#a4d0e8" />
          <stop offset=".66" stopColor="#f5e9d2" />
          <stop offset="1" stopColor="#d4e3e5" />
        </linearGradient>
        <linearGradient id="cwa-water" x2="0" y2="1">
          <stop stopColor="#659baf" />
          <stop offset="1" stopColor="#d0e4da" />
        </linearGradient>
        <linearGradient id="cwa-mountain" x2=".2" y2="1">
          <stop stopColor="#687e96" />
          <stop offset="1" stopColor="#233f4e" />
        </linearGradient>
      </defs>
      <path fill="url(#cwa-sky)" d="M0 0h1100v720H0z" />
      <circle cx="890" cy="140" r="64" fill="#fff5d7" opacity=".65" />
      <path
        fill="#a8b7c0"
        d="m0 340 160-128 76 65L428 71l123 171 98-91 182 185 87-106 182 151v339H0Z"
      />
      <path
        fill="#dde5e7"
        d="m428 71-96 121 49-16 28 35 29-28 42 28 31-29Zm221 80-49 46 23 1 22 26 17-11 33 13Z"
      />
      <path
        fill="url(#cwa-mountain)"
        d="m0 323 128 32 102-91 159 143 136-55 104 83 132-98 93 53 130-108 116 49v389H0Z"
      />
      <path fill="url(#cwa-water)" d="M0 464q280-78 525-17t575-32v305H0Z" />
      <path
        fill="#547b79"
        opacity=".3"
        d="m0 493 180 50 232-40 150 63 219-68 319 75V460q-250 40-530 0t-570 33Z"
      />
      <path
        fill="#234d46"
        d="m0 423 153 90-118 19 165 74-85 43 224 71H0Zm1100-8-140 91 59 22-117 74 59 53-126 65h265Z"
      />
      <g stroke="#eff7ef" strokeWidth="2" opacity=".45">
        <path d="M240 565h180m120 39h235M377 663h209m220-120h95M619 496h154" />
      </g>
    </svg>
  );
}

/* 以下背景均为本仓库自绘（无第三方素材），用于材质可读性对照基线。
   真实照片样张（photo-real-*）来自 CC0 素材，见 public/media/MEDIA-SOURCES.md。 */

export function RealPhoto({ variant }: { variant: "bright" | "dark" }) {
  return (
    <img
      className="landscape"
      src={`${import.meta.env.BASE_URL}media/photo-real-${variant}.jpg`}
      alt=""
      aria-hidden="true"
      loading="eager"
      decoding="async"
    />
  );
}

export function PhotoLight() {
  return (
    <svg
      className="landscape"
      viewBox="0 0 1100 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cwa-bright-sky" x2="0" y2="1">
          <stop stopColor="#9fd4f2" />
          <stop offset=".6" stopColor="#fdf1d8" />
          <stop offset="1" stopColor="#ffe9c9" />
        </linearGradient>
        <linearGradient id="cwa-bright-hill" x2=".2" y2="1">
          <stop stopColor="#a8d489" />
          <stop offset="1" stopColor="#5f9e5c" />
        </linearGradient>
      </defs>
      <path fill="url(#cwa-bright-sky)" d="M0 0h1100v720H0z" />
      <circle cx="860" cy="150" r="78" fill="#fffbe8" opacity=".9" />
      <circle cx="300" cy="110" r="46" fill="#ffffff" opacity=".8" />
      <circle cx="420" cy="160" r="60" fill="#ffffff" opacity=".65" />
      <path
        fill="url(#cwa-bright-hill)"
        d="m0 430 190-150 150 120 210-170 190 150 160-120 400 290v270H0Z"
      />
      <path fill="#7cb26b" d="m0 560 260-90 300 110 280-80 260 70v150H0Z" />
      <g fill="#f6f9f2">
        <circle cx="140" cy="620" r="10" />
        <circle cx="360" cy="660" r="8" />
        <circle cx="760" cy="640" r="11" />
        <circle cx="980" cy="600" r="8" />
      </g>
      <g fill="#f2b8c6">
        <circle cx="240" cy="640" r="7" />
        <circle cx="560" cy="670" r="9" />
        <circle cx="880" cy="668" r="7" />
      </g>
    </svg>
  );
}

export function PhotoDark() {
  return (
    <svg
      className="landscape"
      viewBox="0 0 1100 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cwa-night-sky" x2="0" y2="1">
          <stop stopColor="#0a1220" />
          <stop offset=".65" stopColor="#152238" />
          <stop offset="1" stopColor="#1d2c46" />
        </linearGradient>
        <linearGradient id="cwa-night-hill" x2=".2" y2="1">
          <stop stopColor="#101b2c" />
          <stop offset="1" stopColor="#070c15" />
        </linearGradient>
      </defs>
      <path fill="url(#cwa-night-sky)" d="M0 0h1100v720H0z" />
      <circle cx="880" cy="140" r="54" fill="#e8ecf5" opacity=".92" />
      <circle cx="864" cy="128" r="50" fill="#152238" opacity=".35" />
      <g fill="#dfe6f2">
        <circle cx="140" cy="90" r="2.4" />
        <circle cx="320" cy="150" r="1.8" />
        <circle cx="520" cy="70" r="2.2" />
        <circle cx="660" cy="180" r="1.6" />
        <circle cx="990" cy="260" r="2" />
        <circle cx="80" cy="240" r="1.6" />
      </g>
      <path
        fill="url(#cwa-night-hill)"
        d="m0 400 170-130 140 110 220-150 200 140 170-110 200 140v420H0Z"
      />
      <path fill="#0a1322" d="m0 540 240-70 300 90 300-60 260 50v170H0Z" />
      <g fill="#ffd88a" opacity=".85">
        <rect x="180" y="600" width="8" height="12" />
        <rect x="260" y="620" width="7" height="10" />
        <rect x="700" y="608" width="8" height="11" />
        <rect x="840" y="628" width="7" height="10" />
        <rect x="980" y="604" width="8" height="12" />
      </g>
    </svg>
  );
}

export function ChartPane() {
  const bars = [
    { label: "Q1", value: 120, color: "#409cff" },
    { label: "Q2", value: 176, color: "#66d17c" },
    { label: "Q3", value: 96, color: "#ffd60a" },
    { label: "Q4", value: 208, color: "#ff6961" },
  ];
  const max = 240;
  return (
    <div className="demo-chart" aria-hidden="true">
      <svg viewBox="0 0 520 300" preserveAspectRatio="xMidYMid meet">
        <g stroke="var(--cwa-design-color-border-subtle)" strokeWidth="1">
          {[60, 120, 180, 240].map((y) => (
            <line key={y} x1="48" x2="500" y1={y} y2={y} />
          ))}
        </g>
        {bars.map((bar, index) => {
          const height = (bar.value / max) * 200;
          return (
            <g key={bar.label}>
              <rect
                x={80 + index * 108}
                y={260 - height}
                width="56"
                height={height}
                rx="10"
                fill={bar.color}
              />
              <text
                x={108 + index * 108}
                y="288"
                textAnchor="middle"
                fill="var(--cwa-design-color-text-muted)"
                fontSize="15"
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function TextListPane() {
  const rows = [
    { title: "周例会纪要", detail: "材质层级与深色定稿结论同步给全部组件负责人。" },
    { title: "发布检查清单", detail: "类型、构建、故事与无障碍说明全部通过后进入候选。" },
    { title: "背景素材来源", detail: "样张背景均为仓库自绘，便于在文档与测试中复现。" },
    { title: "设备验证计划", detail: "桌面浏览器完成后，在真实 iOS Safari 上复核玻璃效果。" },
  ];
  return (
    <div className="demo-text-list" aria-hidden="true">
      {rows.map((row) => (
        <div key={row.title} className="demo-text-list__row">
          <strong>{row.title}</strong>
          <p>{row.detail}</p>
        </div>
      ))}
    </div>
  );
}
export function GlassPlayground({
  material = "glass",
  background = "landscape",
  solid = false,
  tint,
  accent,
  compact = false,
}: {
  material?: SurfaceMaterial;
  background?: string;
  solid?: boolean;
  tint?: number;
  accent?: string;
  compact?: boolean;
}) {
  const context = useCwaContext();
  const [mode, setMode] = useState("focus");
  const [volume, setVolume] = useState(64);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const dark = context.resolvedTheme === "dark" || context.theme === "dark";
  // 显式覆盖与主题实验室导出走同一份构建逻辑，保证预览 = 粘贴代码的实际效果。
  const { variables } = buildThemeOverrides({
    theme: dark ? "dark" : "light",
    tint: tint ?? null,
    accent: accent ?? "",
  });
  return (
    <CwaProvider
      theme={context.theme}
      motion={context.motion}
      density={context.density}
      material={solid ? "solid" : context.material}
      className="playground-scope"
    >
      <div
        className={`glass-playground glass-playground--${background} ${compact ? "glass-playground--compact" : ""}`}
        style={variables}
      >
        {background === "landscape" ? <Landscape /> : null}
        {background === "photo-light" ? <PhotoLight /> : null}
        {background === "photo-dark" ? <PhotoDark /> : null}
        {background === "photo-real-light" ? <RealPhoto variant="bright" /> : null}
        {background === "photo-real-dark" ? <RealPhoto variant="dark" /> : null}
        {background === "chart" ? <ChartPane /> : null}
        {background === "text-list" ? <TextListPane /> : null}
        <div className="scene-caption">
          <span>ALPINE STILLNESS</span>
          <span>材质 × 光 × 背景</span>
        </div>
        <Surface material={material} className="glass-control-panel">
          <div className="panel-top">
            <span className="panel-icon">
              <Icon name="sliders" size={21} />
            </span>
            <div>
              <strong>让界面轻一点。</strong>
              <p>专注于此刻的工作</p>
            </div>
            <Popover>
              <Popover.Trigger
                render={
                  <Button variant="ghost" size="sm" aria-label="查看材质说明">
                    ···
                  </Button>
                }
              />
              <PopoverContent material="solid" aria-label="材质说明">
                <p>这块面板使用真实 Surface 与公开 Token。可拖动滑块、切换模式与保存设置。</p>
              </PopoverContent>
            </Popover>
          </div>
          <SegmentedControl
            aria-label="工作模式"
            items={[
              { value: "focus", label: "专注" },
              { value: "relax", label: "放松" },
              { value: "create", label: "创作" },
            ]}
            value={mode}
            onValueChange={(value) => setMode(String(value))}
          />
          <div className="panel-volume">
            <div>
              <span>背景音量</span>
              <output>{volume}%</output>
            </div>
            <Slider
              aria-label="背景音量"
              value={volume}
              min={0}
              max={100}
              onValueChange={(value) =>
                setVolume(typeof value === "number" ? value : (value[0] ?? 0))
              }
            />
          </div>
          <Switch defaultChecked>允许桌面通知</Switch>
          <Field label="工作区名称">
            <Input defaultValue="My creative space" onChange={() => setSaved(false)} />
          </Field>
          <Button onClick={() => setSaved(true)}>
            保存偏好 <Icon name="arrow" size={17} />
          </Button>
          <p className="panel-status" role="status">
            {saved
              ? "偏好已保存到本次演示"
              : `当前模式：${mode === "focus" ? "专注" : mode === "relax" ? "放松" : "创作"}`}
          </p>
        </Surface>
        <Surface material={material} className="glass-music-bar">
          <span className="album-art" aria-hidden="true">
            ◒
          </span>
          <div>
            <strong>Quiet mountains</strong>
            <p>一段静谧的工作时光</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={playing ? "暂停演示" : "开始演示"}
            aria-pressed={playing}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? "Ⅱ" : "▶"}
          </Button>
          <span className="site-sr-only" role="status">
            {playing ? "演示播放中，无音频" : "演示已暂停"}
          </span>
        </Surface>
      </div>
    </CwaProvider>
  );
}
