// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
// Clear 材质专用样张：照片/媒体上的轻量工具栏。
// 浅色 Clear 配亮调媒体、深色 Clear 配暗调媒体——两种组合都保持文字对比度。

import { IconButton, Surface, Text, useCwaContext } from "@cwa-design/react";
import { useState } from "react";

export default function Example() {
  const context = useCwaContext();
  const dark = context.resolvedTheme === "dark" || context.theme === "dark";
  const [playing, setPlaying] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "26rem",
        minHeight: "15rem",
        borderRadius: "1.25rem",
        overflow: "hidden",
        // 自绘媒体背景（无第三方素材）：亮=晨光草坡，暗=夜色山谷。
        background: dark
          ? "radial-gradient(circle at 78% 18%, #e8ecf5 0 7%, rgba(232,236,245,0) 7.6%), linear-gradient(152deg, #0a1220 0%, #152238 52%, #0a1322 100%)"
          : "radial-gradient(circle at 76% 20%, #fffbe8 0 9%, rgba(255,251,232,0) 9.6%), linear-gradient(152deg, #9fd4f2 0%, #fdf1d8 46%, #a8d489 46.2%, #5f9e5c 100%)",
      }}
    >
      <Surface
        material="glass-clear"
        style={{
          position: "absolute",
          left: "1rem",
          right: "1rem",
          bottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.625rem 0.875rem",
          borderRadius: "1rem",
        }}
      >
        <IconButton
          variant="secondary"
          size="sm"
          label={playing ? "暂停演示" : "播放演示"}
          aria-pressed={playing}
          onClick={() => setPlaying(!playing)}
        >
          <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
        </IconButton>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text as="p" style={{ margin: 0, fontWeight: 590 }}>
            {dark ? "夜色山谷" : "高山晨光"}
          </Text>
          <Text as="p" tone="muted" variant="caption" style={{ margin: 0 }}>
            Clear：媒体上的轻工具栏
          </Text>
        </div>
        <IconButton variant="secondary" size="sm" label="收藏到媒体库">
          <span aria-hidden="true">♡</span>
        </IconButton>
      </Surface>
    </div>
  );
}
