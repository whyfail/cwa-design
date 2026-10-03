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
  Switch,
  useCwaContext,
  type SurfaceMaterial,
} from "@cwa-design/react";
import { type CSSProperties, useState } from "react";
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
  const variables = {
    ...(tint !== undefined
      ? {
          "--cwa-design-color-glass-regular-fill": `rgba(${dark ? "24,31,45" : "255,255,255"},${tint / 100})`,
        }
      : {}),
    ...(accent
      ? { "--cwa-design-color-accent": accent, "--cwa-design-color-on-accent": "#fff" }
      : {}),
  } as CSSProperties;
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
