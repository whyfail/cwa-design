import { Button, Surface, Text, useCwaContext } from "@cwa-design/react";
import { useState } from "react";
import { clearMediaState } from "../background-policy";

/**
 * V03：真实媒体上的 Clear 轻工具栏样张。与 Registry 的自绘 surface-clear-toolbar
 * 示例分开——这里用真实照片（亮/暗）与自绘明暗分区做采样场景，逐媒体验证
 * Clear 的可读性，不把固定渐变样张推广到所有媒体。素材来源见
 * public/media/MEDIA-SOURCES.md。
 */
const CLEAR_MEDIAS = [
  {
    value: "real-bright",
    label: "真实亮照片",
    title: "高山晨光",
    src: `${import.meta.env.BASE_URL}media/photo-real-bright.jpg`,
  },
  {
    value: "real-dark",
    label: "真实暗照片",
    title: "夜色山谷",
    src: `${import.meta.env.BASE_URL}media/photo-real-dark.jpg`,
  },
  { value: "split", label: "自绘明暗分区", title: "明暗之间", src: "" },
] as const;

export type ClearMedia = (typeof CLEAR_MEDIAS)[number]["value"];

export function ClearMediaStage() {
  const [media, setMedia] = useState<ClearMedia>("real-bright");
  const context = useCwaContext();
  const theme = context.resolvedTheme === "dark" || context.theme === "dark" ? "dark" : "light";
  const item = CLEAR_MEDIAS.find((entry) => entry.value === media)!;
  const state = clearMediaState(theme, media);
  return (
    <div className="clear-media-stage" data-clear-media-stage={media}>
      <div className="overlay-stage-picker" role="group" aria-label="Clear 对照媒体">
        {CLEAR_MEDIAS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            aria-pressed={media === entry.value}
            onClick={() => setMedia(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {state.message ? (
        <p className="clear-media-state" role="status">
          {state.message}
        </p>
      ) : null}
      <div className="clear-media-stage-canvas">
        {item.src ? (
          <img
            className="overlay-stage-media"
            src={item.src}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="sync"
          />
        ) : (
          <div className="overlay-stage-media overlay-stage-media--split" aria-hidden="true" />
        )}
        <Surface material="glass-clear" className="clear-media-toolbar">
          <span className="clear-media-toolbar__glyph" aria-hidden="true">
            ▶
          </span>
          <div>
            <strong>{item.title}</strong>
            <Text variant="caption" tone="muted" as="p">
              Clear：媒体上的轻工具栏
            </Text>
          </div>
          <Button variant="ghost" size="sm" aria-label="收藏">
            ♡
          </Button>
        </Surface>
      </div>
    </div>
  );
}
